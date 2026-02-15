import CustomLoader from "@/components/CustomLoader";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white/50 backdrop-blur-sm fixed inset-0 z-50">
      <CustomLoader size={60} />
    </div>
  );
}
