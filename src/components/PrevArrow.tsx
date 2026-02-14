import { ChevronLeft } from 'lucide-react';

interface PrevArrowProps {
  onClick?: () => void;
}

const PrevArrow = ({ onClick }: PrevArrowProps) => {
  return (
    <button
      className="custom-arrow prev-arrow"
      onClick={onClick}
      aria-label="Previous slide"
      type="button"
    >
      <ChevronLeft size={24} />
    </button>
  );
};

export default PrevArrow;
