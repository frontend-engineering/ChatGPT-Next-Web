import { Analytics } from "@vercel/analytics/react";

import { Home } from "./components/home";

import { getServerSideConfig } from "./config/server";
import AdSimple from "./components/AdSimple";

const serverConfig = getServerSideConfig();

// export const config = {
//   amp: true,
// };

export default async function App() {
  return (
    <>
      <Home />
      {/* <AdSimple /> */}
      {serverConfig?.isVercel && <Analytics />}
    </>
  );
}
