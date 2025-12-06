// Toast utility for showing notifications
// This is a simple utility that can be used with React Context

let toastCallback = null;

export const setToastCallback = (callback) => {
  toastCallback = callback;
};

export const showToast = (message, type = "info") => {
  if (toastCallback) {
    toastCallback(message, type);
  } else {
    console.warn("Toast callback not set. Message:", message);
  }
};

export const showSuccess = (message) => showToast(message, "success");
export const showError = (message) => showToast(message, "error");
export const showInfo = (message) => showToast(message, "info");

export default {
  showToast,
  showSuccess,
  showError,
  showInfo,
};
