import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Otherwise shows up in local test prints — the print-agent screenshots
  // whatever URL it's given, and in dev that's localhost with this badge on.
  devIndicators: false,
};

export default nextConfig;
