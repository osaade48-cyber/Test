import type { Metadata } from "next";
import { configFromParams, DEFAULT_CONFIG } from "@/lib/configurator";
import { RenderStill } from "./RenderStill";

export const metadata: Metadata = { title: "Render", robots: { index: false, follow: false } };

/**
 * Full-window still renders for marketing imagery (gallery, posters, social).
 * Example: /render?size=L&colour=charcoal&look=flat&inside=ply&floor=vinyl&addons=deck,lights,planter&name=ARCHIE&time=dusk&view=overview&door=open
 */
export default async function RenderPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const config = configFromParams(sp) ?? DEFAULT_CONFIG;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined));
  return <RenderStill config={config} dusk={one("time") === "dusk"} doorOpen={one("door") !== "closed"} view={one("view") ?? "overview"} />;
}
