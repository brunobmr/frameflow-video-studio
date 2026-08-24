export function GET() {
  return Response.json({
    status: "ok",
    service: "frameflow-video-studio",
    timestamp: new Date().toISOString(),
  });
}
