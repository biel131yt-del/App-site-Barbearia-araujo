import withPWAInit from "next-pwa";

// PWA: gera service worker + manifest em produção (desligado em dev)
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/webp"],
  },
  async redirects() {
    return [
      { source: "/admin", destination: "/admin/dashboard", permanent: false },
      { source: "/admin/configuracoes", destination: "/admin/config", permanent: false },
    ];
  },
};

export default withPWA(nextConfig);
