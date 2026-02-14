import { HomePage } from "./components/HomePage";

export const revalidate = 3600;

export default async function Page() {
  return <HomePage />;
}
