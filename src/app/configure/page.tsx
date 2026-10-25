import type { Metadata } from "next";
import { Configurator } from "@/components/configurator/Configurator";
import { configFromParams, DEFAULT_CONFIG } from "@/lib/configurator";

export const metadata: Metadata = {
  title: "Configure your home",
  description: "Configure your modular dog home in 3D: size, panel colour and look, interior, floor and add-ons, with a live indicative price.",
};

export default async function ConfigurePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const initial = configFromParams(await searchParams) ?? DEFAULT_CONFIG;
  return <Configurator initial={initial} />;
}
