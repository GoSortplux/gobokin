import Swal from 'sweetalert2';

/**
 * Customized SweetAlert2 instance with brand colors and modern styling.
 */
const BrandSwal = Swal.mixin({
  confirmButtonColor: '#295FA7', // Primary Blue
  cancelButtonColor: '#B68945',  // Secondary Gold
  customClass: {
    popup: 'brand-swal-popup',
    title: 'brand-swal-title',
    confirmButton: 'brand-swal-confirm',
    cancelButton: 'brand-swal-cancel',
  },
  buttonsStyling: true,
});

/**
 * Toast notification helper for simple informational alerts.
 */
export const toast = BrandSwal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

/**
 * Destructive action helper (e.g., for deletions).
 */
export const destructive = BrandSwal.mixin({
  confirmButtonColor: '#EF4444', // Modern Red
});

// Create a combined object for default export
const CustomSwal = BrandSwal as typeof BrandSwal & {
  toast: typeof toast;
  destructive: typeof destructive;
};

CustomSwal.toast = toast;
CustomSwal.destructive = destructive;

export default CustomSwal;
