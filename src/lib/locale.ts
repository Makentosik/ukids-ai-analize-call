export const LOCALE = 'ru-RU';

export const dt = (d: Date | string) => {
  const date = new Date(d);
  if (isNaN(date.getTime())) {
    return 'Неверная дата';
  }
  return new Intl.DateTimeFormat(LOCALE, { 
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
    // timeZone убран - будет использоваться локальный часовой пояс
  }).format(date);
};

export const dateOnly = (d: Date | string) => {
  const date = new Date(d);
  if (isNaN(date.getTime())) {
    return 'Неверная дата';
  }
  return new Intl.DateTimeFormat(LOCALE, { 
    year: 'numeric',
    month: 'short',
    day: '2-digit'
    // timeZone убран - будет использоваться локальный часовой пояс
  }).format(date);
};

export const timeOnly = (d: Date | string) => {
  const date = new Date(d);
  if (isNaN(date.getTime())) {
    return 'Неверная дата';
  }
  return new Intl.DateTimeFormat(LOCALE, { 
    hour: '2-digit',
    minute: '2-digit'
    // timeZone убран - будет использоваться локальный часовой пояс
  }).format(date);
};

// Russian error messages for Zod
import { z } from 'zod';

const russianErrorMap = (issue: any, ctx: any) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.expected === 'string') {
        return { message: 'Поле должно быть строкой' };
      }
      if (issue.expected === 'number') {
        return { message: 'Поле должно быть числом' };
      }
      if (issue.expected === 'boolean') {
        return { message: 'Поле должно быть булевым значением' };
      }
      return { message: 'Неверный тип данных' };
    case z.ZodIssueCode.too_small:
      if (issue.type === 'string') {
        return { message: `Минимальная длина ${issue.minimum} символов` };
      }
      return { message: 'Значение слишком маленькое' };
    case z.ZodIssueCode.too_big:
      if (issue.type === 'string') {
        return { message: `Максимальная длина ${issue.maximum} символов` };
      }
      return { message: 'Значение слишком большое' };
    case z.ZodIssueCode.invalid_format:
      if (issue.format === 'email') {
        return { message: 'Неверный формат email' };
      }
      if (issue.format === 'url') {
        return { message: 'Неверный формат URL' };
      }
      return { message: 'Неверный формат' };
    case z.ZodIssueCode.unrecognized_keys:
      return { message: 'Неизвестные ключи в объекте' };
    case z.ZodIssueCode.invalid_union:
      return { message: 'Неверное значение' };
    case z.ZodIssueCode.invalid_value:
      return { message: 'Неверное значение' };
    default:
      return { message: ctx.defaultError };
  }
};

// Russian error map available for use if needed
// z.setErrorMap(russianErrorMap);

// Toast messages in Russian
export const toastMessages = {
  success: 'Успешно',
  error: 'Ошибка',
  dataSaved: 'Данные сохранены',
  sentToN8n: 'Отправлено в n8n',
  failedToSend: 'Не удалось отправить',
  invalidCredentials: 'Неверный email или пароль',
  userCreated: 'Пользователь создан',
  userDeleted: 'Пользователь удален',
  checklistSaved: 'Чек-лист сохранен',
  checklistDeleted: 'Чек-лист удален',
  reviewSent: 'Проверка отправлена',
  accessDenied: 'Доступ запрещен'
};

// UI text constants in Russian
export const uiText = {
  // Navigation
  nav: {
    calls: 'Звонки',
    checklists: 'Чек-листы',
    admin: 'Админ',
    profile: 'Профиль',
    logout: 'Выйти'
  },
  
  // Login page
  login: {
    title: 'Вход',
    email: 'Email',
    password: 'Пароль',
    submit: 'Войти',
    error: 'Неверный email или пароль'
  },
  
  // Calls table
  calls: {
    tableHeaders: {
      id: 'ID',
      deal: 'Сделка',
      created: 'Создано',
      employee: 'Сотрудник',
      manager: 'Руководитель',
      actions: 'Действия'
    },
    callDetails: 'Информация о звонке',
    selectChecklist: 'Выберите чек-лист',
    comment: 'Комментарий',
    sendToN8n: 'Отправить в n8n',
    noCallsFound: 'Звонки не найдены',
    loading: 'Загрузка...',
    reviewHistory: 'История проверок',
    deleteReview: 'Удалить проверку',
    confirmDeleteReview: 'Удалить эту проверку?',
    confirmDeleteReviewText: 'Это действие нельзя отменить. Проверка и все связанные результаты будут удалены навсегда.',
    reviewDeleted: 'Проверка успешно удалена',
    deleteError: 'Ошибка при удалении проверки'
  },
  
  // Checklists
  checklists: {
    title: 'Чек-листы',
    newChecklist: 'Новый чек-лист',
    editChecklist: 'Редактировать чек-лист',
    createChecklist: 'Создать чек-лист',
    name: 'Название',
    description: 'Описание',
    active: 'Активен',
    inactive: 'Неактивен',
    status: 'Статус',
    items: 'Элементы',
    itemsCount: 'Количество элементов',
    save: 'Сохранить',
    delete: 'Удалить',
    reorder: 'Изменить порядок',
    addItem: 'Добавить элемент',
    removeItem: 'Удалить элемент',
    removeAll: 'Удалить все',
    itemText: 'Текст элемента',
    orderIndex: 'Порядок',
    dragToReorder: 'Перетащите для изменения порядка',
    noChecklistsFound: 'Чек-листы не найдены',
    noItemsFound: 'Нет элементов чек-листа',
    addFirstItem: 'Добавьте первый элемент для начала работы',
    howToUse: 'Как использовать редактор:',
    dragInstruction: '• Перетаскивайте элементы за иконку для изменения порядка',
    requiredInstruction: '• Все элементы обязательны для заполнения',
    created: 'Создан',
    updated: 'Обновлён',
    actions: 'Действия',
    toggleStatus: 'Изменить статус',
    confirmDelete: 'Вы уверены, что хотите удалить этот чек-лист?',
    confirmDeleteText: 'Это действие нельзя отменить. Чек-лист будет удален навсегда.',
    saveSuccess: 'Чек-лист успешно сохранен',
    updateSuccess: 'Чек-лист успешно обновлен',
    deleteSuccess: 'Чек-лист успешно удален',
    toggleSuccess: 'Статус чек-листа изменен',
    loadError: 'Ошибка при загрузке чек-листа',
    saveError: 'Ошибка при сохранении чек-листа',
    deleteError: 'Ошибка при удалении чек-листа',
    required: 'Обязательное поле',
    minLength: 'Минимальная длина',
    maxLength: 'Максимальная длина',
    duplicateNames: 'Названия элементов должны быть уникальными',
    emptyItems: 'Добавьте хотя бы один элемент',
    backToList: 'Вернуться к списку',
    itemWeight: 'Вес элемента'
  },
  
  // Profile
  profile: {
    title: 'Мой профиль',
    subtitle: 'Управление вашими данными и настройками',
    personalInfo: 'Личные данные',
    personalInfoDescription: 'Обновите ваше имя и email адрес',
    name: 'Полное имя',
    email: 'Email адрес',
    role: 'Ваша роль',
    memberSince: 'Участник с',
    changePassword: 'Смена пароля',
    changePasswordDescription: 'Обновите ваш пароль для большей безопасности',
    currentPassword: 'Текущий пароль',
    newPassword: 'Новый пароль',
    confirmPassword: 'Подтвердите новый пароль',
    saveProfile: 'Сохранить профиль',
    changePasswordBtn: 'Изменить пароль',
    profileUpdated: 'Профиль успешно обновлен',
    passwordUpdated: 'Пароль успешно изменен',
    incorrectCurrentPassword: 'Неверный текущий пароль',
    passwordsDoNotMatch: 'Пароли не совпадают',
    emailAlreadyExists: 'Email уже используется другим пользователем'
  },
  
  // Admin
  admin: {
    users: 'Пользователи',
    createUser: 'Создать пользователя',
    editUser: 'Редактировать пользователя',
    userName: 'Имя пользователя',
    userEmail: 'Email пользователя',
    userRole: 'Роль',
    newPassword: 'Новый пароль',
    confirmDelete: 'Подтвердить удаление',
    deleteUserConfirm: 'Вы уверены, что хотите удалить этого пользователя?',
    cancel: 'Отменить'
  },
  
  // Common
  common: {
    loading: 'Загрузка...',
    save: 'Сохранить',
    cancel: 'Отменить',
    delete: 'Удалить',
    edit: 'Редактировать',
    view: 'Просмотр',
    close: 'Закрыть',
    confirm: 'Подтвердить',
    yes: 'Да',
    no: 'Нет',
    search: 'Поиск',
    filter: 'Фильтр',
    clear: 'Очистить',
    selectAll: 'Выбрать все',
    deselectAll: 'Отменить выбор'
  },
  
  // Roles
  roles: {
    ADMINISTRATOR: 'Администратор',
    OCC_MANAGER: 'Менеджер ОКК',
    SUPERVISOR: 'Руководитель'
  },
  
  // Status
  status: {
    PENDING: 'Ожидает',
    SENT: 'Отправлено',
    SUCCESS: 'Успешно',
    FAILED: 'Ошибка'
  }
};
