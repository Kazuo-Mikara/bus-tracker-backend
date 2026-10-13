const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '../src/data/bus-stops');
const outputRoutesFile = path.join(__dirname, '../src/data/routes.json');
const outputStopsFile = path.join(__dirname, '../src/data/bus_stops.json');
const outputBusesFile = path.join(__dirname, '../src/data/buses.json');

function distMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

console.log('Reading YBS route files from:', inputDir);
const files = fs.readdirSync(inputDir).filter((f) => f.endsWith('.json'));

// Sort files logically (numerical first, then alpha)
files.sort((a, b) => {
  const numA = parseInt(a.replace(/[^0-9]/g, ''), 10) || 9999;
  const numB = parseInt(b.replace(/[^0-9]/g, ''), 10) || 9999;
  if (numA !== numB) return numA - numB;
  return a.localeCompare(b);
});

const allStops = [];
let stopCounter = 1;
const grid = new Map();

function findExistingStop(nameEn, nameMm, lat, lng) {
  const normEn = (nameEn || '').trim().toLowerCase();
  const normMm = (nameMm || '').trim();

  const cellLat = Math.round(lat * 100);
  const cellLng = Math.round(lng * 100);

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const cellKey = `${cellLat + dx}_${cellLng + dy}`;
      const candidates = grid.get(cellKey);
      if (!candidates) continue;

      for (const stop of candidates) {
        const d = distMeters(lat, lng, stop.lat, stop.lng);
        if (d <= 75) {
          const sEn = (stop.name || '').trim().toLowerCase();
          const sMm = (stop.nameLocal || '').trim();
          if ((normEn && normEn === sEn) || (normMm && normMm === sMm) || d <= 15) {
            return stop;
          }
        }
      }
    }
  }
  return null;
}

function registerStop(stop) {
  allStops.push(stop);
  const cellLat = Math.round(stop.lat * 100);
  const cellLng = Math.round(stop.lng * 100);
  const cellKey = `${cellLat}_${cellLng}`;
  if (!grid.has(cellKey)) grid.set(cellKey, []);
  grid.get(cellKey).push(stop);
}

const routes = [];

files.forEach((f, index) => {
  const raw = fs.readFileSync(path.join(inputDir, f), 'utf8');
  const d = JSON.parse(raw);

  let routeId = d.bus_line || d.route_id;
  if (f === 'ybs_203_data.json') routeId = '203';
  routeId = String(routeId);

  const routeName = d.route_info?.['Line Name'] || `Route ${routeId}`;
  const color = hslToHex((index * 137.5) % 360, 75, 45);

  const routeStopIds = [];
  const polyline = [];

  for (const s of d.stops || []) {
    polyline.push([Number(s.latitude.toFixed(6)), Number(s.longitude.toFixed(6))]);

    let stop = findExistingStop(s.stop_name_en, s.stop_name_mm, s.latitude, s.longitude);
    if (!stop) {
      const id = `stop_${String(stopCounter++).padStart(4, '0')}`;
      stop = {
        id,
        name: s.stop_name_en || s.stop_name_mm || `Stop ${id}`,
        nameLocal: s.stop_name_mm || undefined,
        lat: Number(s.latitude.toFixed(6)),
        lng: Number(s.longitude.toFixed(6)),
        routes: [routeId],
      };
      registerStop(stop);
    } else {
      if (!stop.routes.includes(routeId)) {
        stop.routes.push(routeId);
      }
    }
    routeStopIds.push(stop.id);
  }

  routes.push({
    id: routeId,
    name: routeName,
    color,
    stops: routeStopIds,
    polyline,
    schedule: {
      weekday: [
        '06:00',
        '06:15',
        '06:30',
        '06:45',
        '07:00',
        '07:30',
        '08:00',
        '08:30',
        '09:00',
        '17:00',
        '17:30',
        '18:00',
        '18:30',
        '19:00',
        '20:00',
      ],
      weekend: [
        '06:30',
        '07:00',
        '07:30',
        '08:00',
        '08:30',
        '09:00',
        '17:00',
        '17:30',
        '18:00',
        '19:00',
      ],
    },
  });
});

// Generate realistic simulated buses for popular lines
const priorityRouteIds = [
  '1', '2', '3', '4', '5', '6', '7 (Nat Sin)', '8', '10', '11', '12', '14',
  '15', '21', '26', '27', '29', '32', '37', '38', '56', '65', '89 (Min Nanda Rd)',
  '100', '108', '110', '116', '124', '139'
];

const buses = [];
let busCounter = 100;

for (const pId of priorityRouteIds) {
  const route = routes.find((r) => r.id === pId);
  if (!route || route.polyline.length < 5) continue;

  const len = route.polyline.length;
  // Create 2 buses per priority route, spaced out
  const bus1Seg = Math.floor(len * 0.15);
  const bus2Seg = Math.floor(len * 0.65);

  buses.push({
    id: `bus_${++busCounter}`,
    routeId: route.id,
    capacity: 45,
    speedMps: Number((8.2 + (Math.random() * 1.5)).toFixed(1)),
    currentSegIndex: bus1Seg,
    currentProgress: 0.1,
  });

  buses.push({
    id: `bus_${++busCounter}`,
    routeId: route.id,
    capacity: 40,
    speedMps: Number((8.0 + (Math.random() * 1.5)).toFixed(1)),
    currentSegIndex: bus2Seg,
    currentProgress: 0.5,
  });
}

// Write outputs
fs.writeFileSync(outputRoutesFile, JSON.stringify(routes, null, 2), 'utf8');
fs.writeFileSync(outputStopsFile, JSON.stringify(allStops, null, 2), 'utf8');
fs.writeFileSync(outputBusesFile, JSON.stringify(buses, null, 2), 'utf8');

console.log(`✅ Successfully compiled:`);
console.log(`   - ${routes.length} Bus Routes -> ${outputRoutesFile}`);
console.log(`   - ${allStops.length} Unique Bus Stops -> ${outputStopsFile}`);
console.log(`   - ${buses.length} Active Simulated Buses -> ${outputBusesFile}`);
