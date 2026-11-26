import { Suspense } from "react";
import { ManagePlugin } from "@/components/ManagePlugin";

export const metadata = { title: "Manage plugin", robots: { index: false } };

export default function ManagePage({ params }: PageProps<"/p/[slug]/manage">) {
  return (
    <Suspense>
      <Manage params={params} />
    </Suspense>
  );
}

async function Manage({ params }: { params: PageProps<"/p/[slug]/manage">["params"] }) {
  const { slug } = await params;
  return <ManagePlugin slug={slug} />;
}
