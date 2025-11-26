import { message } from "ant-design-vue";

export const showSuccess = (text) => {
  message.success(text);
};

export const showError = (text) => {
  message.error(text);
};
