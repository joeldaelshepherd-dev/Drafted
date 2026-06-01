import type { Metadata } from "next";
import { CreatePoolClient } from "@/components/pools/CreatePoolClient";

export const metadata: Metadata = {
  title: "Create a pool — Drafted",
};

export default function NewPoolPage() {
  return <CreatePoolClient />;
}
