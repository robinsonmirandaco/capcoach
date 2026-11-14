import type { NextConfig } from "next";

// Sitios que pueden insertar el chatbot en un iframe.
// Para cambiar el dominio de la campaña sin tocar código, define la variable
// de entorno FRAME_ANCESTORS en Vercel (orígenes separados por espacios).
const campaignOrigins =
  process.env.FRAME_ANCESTORS ??
  "https://plasticfisherman.com https://www.plasticfisherman.com https://acleanerplanet.org https://www.acleanerplanet.org";

const nextConfig: NextConfig = {
  // El system prompt se lee del disco en el servidor: hay que incluirlo en el bundle de la función.
  outputFileTracingIncludes: {
    "/api/chat": ["./config/**/*"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors 'self' https://*.vercel.app ${campaignOrigins}`,
          },
          // Permite micrófono cuando la página va dentro de un iframe con allow="microphone".
          { key: "Permissions-Policy", value: "microphone=*" },
        ],
      },
    ];
  },
};

export default nextConfig;
