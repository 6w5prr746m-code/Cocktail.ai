import { useLocaleStore } from "../../state/locale";
import { fr } from "./fr";
import { en } from "./en";
import type { TranslationSchema } from "./fr";

const DICTIONARIES = { fr, en };

type LeafPath<T, Prefix extends string = ""> = T extends string
  ? Prefix
  : { [K in keyof T & string]: LeafPath<T[K], `${Prefix}${Prefix extends "" ? "" : "."}${K}`> }[keyof T & string];

export type TranslationKey = LeafPath<TranslationSchema>;

function resolve(dict: TranslationSchema, key: string): string | undefined {
  const parts = key.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = dict;
  for (const part of parts) {
    if (node == null) return undefined;
    node = node[part];
  }
  return typeof node === "string" ? node : undefined;
}

/** Hook de traduction — clés en dot-path (ex: "home.heading"), interpolation `{{var}}` optionnelle. Repli sur le français puis sur la clé brute si une traduction manque, pour ne jamais planter l'affichage. */
export function useTranslation() {
  const locale = useLocaleStore((s) => s.locale) ?? "fr";

  function t(key: TranslationKey, params?: Record<string, string | number>): string {
    const raw = resolve(DICTIONARIES[locale], key) ?? resolve(fr, key) ?? key;
    if (!params) return raw;
    return Object.entries(params).reduce((acc, [k, v]) => acc.replaceAll(`{{${k}}}`, String(v)), raw);
  }

  return { t, locale };
}
