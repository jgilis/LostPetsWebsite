import SightingClient from "./SightingClient";

export default function Page({
  params,
}: {
  params: { id: string };
}) {
  return <SightingClient id={params.id} />;
}