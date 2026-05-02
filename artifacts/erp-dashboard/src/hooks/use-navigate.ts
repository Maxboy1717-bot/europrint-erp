import { useLocation } from "wouter";

export function useNavigate(): (path: string) => void {
  const [, setLocation] = useLocation();
  return (path: string) => setLocation(path);
}
