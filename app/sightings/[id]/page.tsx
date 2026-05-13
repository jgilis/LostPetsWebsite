import SightingClient from "./SightingClient";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <SightingClient id={id} />;
}