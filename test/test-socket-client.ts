import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  transports: ['websocket'],
});

console.log('Connecting to WebSocket server at http://localhost:3001...');

let packetCount = 0;

socket.on('connect', () => {
  console.log('✅ Connected successfully! Socket ID:', socket.id);
});

socket.on('bus:telemetry', (data: any[]) => {
  packetCount++;
  console.log(`\n📦 [Tick #${packetCount}] Received telemetry for ${data.length} buses:`);
  data.forEach((bus) => {
    console.log(
      `   🚍 Bus ${bus.id} (${bus.routeId}) -> Lat: ${bus.lat}, Lng: ${bus.lng}, Heading: ${bus.heading}°, Speed: ${bus.speedKmh} km/h, Next: ${bus.nextStopId}, ETA: ${bus.etaSecondsToNextStop}s`,
    );
  });

  if (packetCount >= 3) {
    console.log('\n🎉 Successfully verified 3 real-time telemetry ticks! Closing connection.');
    socket.disconnect();
    process.exit(0);
  }
});

socket.on('connect_error', (err) => {
  console.error('❌ Connection error:', err.message);
  process.exit(1);
});
