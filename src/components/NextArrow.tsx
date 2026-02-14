import { ChevronRight } from 'lucide-react';

interface NextArrowProps {
  onClick?: () => void;
}

const NextArrow = ({ onClick }: NextArrowProps) => {
  return (
    <button
      className="custom-arrow next-arrow"
      onClick={onClick}
      aria-label="Next slide"
      type="button"
    >
      <ChevronRight size={24} />
    </button>
  );
};

export default NextArrow;
