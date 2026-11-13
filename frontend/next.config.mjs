import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname),
  reactStrictMode: true,
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async redirects() {
    return [
      {
        source: '/dashboard/teacher/exams/create',
        destination: '/dashboard/teacher?tab=create',
        permanent: false,
      },
      {
        source: '/dashboard/teacher/ai-forms',
        destination: '/dashboard/teacher?tab=custom-forms',
        permanent: false,
      },
      {
        source: '/dashboard/teacher/directories',
        destination: '/dashboard/teacher?tab=students',
        permanent: false,
      },
      {
        source: '/dashboard/teacher/:tab(forms|custom-forms|exams|students|kb|bank|create|reports|proctoring|mock-tests|certificates)',
        destination: '/dashboard/teacher?tab=:tab',
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
