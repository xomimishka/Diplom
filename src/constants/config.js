// API Configuration
export const API_URL = "http://localhost:5000";

// Months in Russian
export const MONTHS = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

// Date limits
export const YEARS_RANGE = 10; // Number of future years for selection

// Validation
export const TITLE_MAX_LENGTH = 100;
export const URL_MAX_LENGTH = 1000;

// Messages
export const ERROR_MESSAGES = {
  SAVE_FAILED: "Не удалось сохранить изменения",
  URL_INVALID: "URL недоступен",
  NO_CHANGES: "Нет изменений для сохранения",
};

export const SUCCESS_MESSAGES = {
  SAVED: "Изменения сохранены",
  COPIED: "Ссылка скопирована",
};
