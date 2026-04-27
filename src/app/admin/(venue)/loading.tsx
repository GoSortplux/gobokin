import CustomLoader from "@/components/CustomLoader";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px] w-full">
      <CustomLoader size={48} />
    </div>
  );
}
