export type AppLocale = 'ru' | 'en';

export const LANGUAGE_STORAGE_KEY = 'vdvoem_language';
export const LANGUAGE_CHANGE_EVENT = 'vdvoem-language-change';

const english: Record<string, string> = {
  'Вдвоём': 'Вдвоём',
  '♡ Вдвоём': '♡ Вдвоём',
  'Общее пространство для двоих': 'A shared space for two',
  'пространство для двоих': 'a space for two',
  'Пользователь': 'User',

  'Главная': 'Home',
  'Календарь': 'Calendar',
  'Вишлисты': 'Wishlists',
  'Карта': 'Map',
  'Доска дня': 'Daily Board',
  'Настройки': 'Settings',
  'скоро': 'soon',
  'Открыть': 'Open',
  'Смотреть всё': 'View all',
  'На главную': 'Back home',
  'Назад': 'Back',
  'Обновить': 'Refresh',
  'Сегодня': 'Today',
  'Отмена': 'Cancel',
  'Удалить': 'Delete',
  'Редактировать': 'Edit',
  'Сохранить': 'Save',
  'Закрыть': 'Close',
  'Изменить': 'Edit',

  'Планы, желания и моменты, которые вы создаёте вместе.':
  'Plans, wishes, and moments you create together.',

  'Ваше общее пространство': 'Your shared space',
  'Добро пожаловать, вы вдвоём! 💕': 'Welcome, you are together! 💕',
  'Ваши планы рядом, даже когда вы далеко.': 'Your plans stay close, even when you are far apart.',
  '♡ Профиль партнёра': '♡ Partner profile',
  'Профиль партнёра': 'Partner profile',
  'Привет, {name} ♡': 'Hi, {name} ♡',
  'Дней вместе': 'Days together',
  'Ближайшие события': 'Upcoming events',
  'Весь день': 'All day',
  'Смотреть все события →': 'View all events →',
  'Желаний пока нет': 'No wishes yet',
  'Перейти к вишлистам': 'Go to wishlists',
  'Вы': 'You',
  'Партнёр': 'Partner',
  'Сегодняшние моменты': "Today's moments",
  'Нажмите, чтобы открыть': 'Tap to open',
  'Фото сегодня': 'Photo today',
  'Фото пока нет': 'No photo yet',
  'Открыть доску дня': 'Open Daily Board',
  'Планов впереди': 'Upcoming plans',
  'Общих желаний': 'Shared wishes',
  'Неплохо бы': 'Nice to have',
  'Хочу': 'Want it',
  'Очень хочу': 'Really want it',
  'Очень сильно хочу': 'Really, really want it',
  'Мечтаю': 'Dreaming of it',
  'день': 'day',
  'дня': 'days',
  'дней': 'days',

  'Не удалось загрузить данные': 'Failed to load data',
  'Не удалось открыть страницу': 'Failed to open the page',

  'История': 'History',
  'Новое событие': 'New event',
  '♡ Общее пространство': '♡ Shared space',
  'Ваши общие планы, встречи и важные даты.': 'Your shared plans, meetings, and important dates.',
  'Предыдущий месяц': 'Previous month',
  'Следующий месяц': 'Next month',
  'Пн': 'Mon',
  'Вт': 'Tue',
  'Ср': 'Wed',
  'Чт': 'Thu',
  'Пт': 'Fri',
  'Сб': 'Sat',
  'Вс': 'Sun',
  'Выбрать {date}': 'Select {date}',
  'ещё': 'more',
  'Выбранный день': 'Selected day',
  'Выберите дату': 'Select a date',
  'Добавить событие': 'Add event',
  'Планов пока нет': 'No plans yet',
  'Хороший день, чтобы что-нибудь запланировать.': 'A good day to plan something.',
  'Ваши общие воспоминания': 'Your shared memories',
  'История событий': 'Event history',
  'Здесь автоматически появляются события, которые уже завершились.': 'Completed events appear here automatically.',
  'Закрыть историю': 'Close history',
  'Загружаем прошлые события...': 'Loading past events...',
  'История пока пуста': 'History is empty for now',
  'Когда события завершатся, они автоматически появятся здесь.': 'Once events are completed, they will appear here automatically.',
  'Добавил(а):': 'Added by:',
  'Всего завершённых событий:': 'Completed events total:',
  'Событие': 'Event',
  'Редактирование': 'Editing',
  'Новый план': 'New plan',
  'Изменить событие': 'Edit event',
  'Название': 'Title',
  'Например, свидание ♡': 'For example, date night ♡',
  'Дата': 'Date',
  'Время начала указывать не нужно': 'No start time is needed',
  'Начало': 'Start',
  'Окончание': 'End',
  'Место': 'Location',
  'Необязательно': 'Optional',
  'Заметка': 'Note',
  'Что важно не забыть?': 'What should you remember?',
  'Сохраняем...': 'Saving...',
  'Сохранить изменения': 'Save changes',
  'Создать событие': 'Create event',
  'Удалить событие?': 'Delete event?',
  '«{title}» будет удалено из общего календаря для вас обоих.': '“{title}” will be removed from your shared calendar for both of you.',
  'Удаляем...': 'Deleting...',
  'Не удалось загрузить календарь': 'Failed to load calendar',
  'Не удалось открыть событие': 'Failed to open event',
  'Не удалось загрузить историю событий': 'Failed to load event history',
  'Укажите название события': 'Enter an event title',
  'Укажите дату события': 'Enter an event date',
  'Время окончания не может быть раньше начала': 'End time cannot be earlier than start time',
  'Не удалось сохранить событие': 'Failed to save event',
  'Не удалось удалить событие': 'Failed to delete event',

  '♡ Ваш день': '♡ Your day',
  'Одно фото от каждого из вас. Маленький ежедневный снимок жизни, который со временем превращается в общую историю.': 'One photo from each of you. A small daily snapshot that gradually becomes your shared story.',
  'Ваши два момента': 'Your two moments',
  'По одному фото на человека': 'One photo per person',
  'Архив': 'Archive',
  'Предыдущие дни': 'Previous days',
  'Здесь постепенно соберётся ваша общая визуальная история.': 'Your shared visual story will gradually gather here.',
  'Архив пока пуст': 'Archive is empty for now',
  'После первого завершённого дня фотографии появятся здесь.': 'Photos will appear here after your first completed day.',
  'Доска дня пока недоступна.': 'Daily Board is currently unavailable.',
  'Фото дня {name}': "{name}'s photo of the day",
  'Без подписи': 'No caption',
  'Добавлено в': 'Added at',
  'Фото сегодня ещё нет': 'No photo today yet',
  'Добавь один момент сегодняшнего дня.': 'Add one moment from today.',
  'Когда партнёр добавит фото, оно появится здесь.': "When your partner adds a photo, it will appear here.",
  'Добавить фото': 'Add photo',
  'Заменить фото или подпись': 'Replace photo or caption',
  '{name} ничего не добавил(а)': '{name} has not added anything',
  'Фото {name}': '{name} photo',
  'Сегодняшний момент': "Today's moment",
  'Изменить фото дня': 'Edit photo of the day',
  'Добавить фото дня': 'Add photo of the day',
  'Предпросмотр': 'Preview',
  'Выбрать другое фото': 'Choose another photo',
  'Выберите фотографию': 'Choose a photo',
  'Можно нажать сюда, перетащить файл или вставить изображение через Ctrl + V': 'Click here, drag a file, or paste an image with Ctrl + V',
  'JPG, PNG или WEBP · до 10 МБ': 'JPG, PNG or WEBP · up to 10 MB',
  'Подпись': 'Caption',
  'Что хочется запомнить об этом моменте?': 'What do you want to remember about this moment?',
  'Добавить на доску': 'Add to board',
  'Удалить сегодняшнее фото?': "Delete today's photo?",
  'Оно исчезнет и с вашей доски, и из будущего архива этого дня.': 'It will disappear from your board and from the future archive for this day.',
  'Аватар {name}': '{name} avatar',
  'Собираем ваши моменты...': 'Gathering your moments...',
  'Поддерживаются только JPG, PNG и WEBP': 'Only JPG, PNG, and WEBP are supported',
  'Фотография должна быть не больше 10 МБ': 'Photo must be no larger than 10 MB',
  'Сначала выберите фотографию': 'Choose a photo first',
  'Не удалось загрузить доску дня': 'Failed to load Daily Board',
  'Не удалось сохранить фотографию': 'Failed to save photo',
  'Не удалось удалить фотографию': 'Failed to delete photo',

  'Приглашения': 'Invitations',
  '♡ Отношения': '♡ Relationship',
  'Здесь можно принять, отклонить или отменить приглашение в отношения.': 'Accept, decline, or cancel relationship invitations here.',
  'Входящие': 'Incoming',
  'Вас приглашают': 'Invitations for you',
  'Новых приглашений пока нет': 'No new invitations',
  'Исходящие': 'Sent',
  'Вы пригласили': 'You invited',
  'Отправленных приглашений нет': 'No sent invitations',
  'Хочет создать с вами общее пространство ♡': 'Wants to create a shared space with you ♡',
  'Принять': 'Accept',
  'Отклонить': 'Decline',
  'Ожидает': 'Pending',
  'Отменить приглашение': 'Cancel invitation',
  '♡ Начало истории': '♡ The beginning of your story',
  'Вы и {name}': 'You and {name}',
  'Укажите день начала ваших отношений.': 'Choose the day your relationship began.',
  'Дата начала отношений': 'Relationship start date',
  'Создаём пространство...': 'Creating your space...',
  'Начать отношения': 'Start relationship',
  'Не удалось загрузить приглашения': 'Failed to load invitations',
  'Не удалось принять приглашение': 'Failed to accept invitation',

  'С возвращением ♡': 'Welcome back ♡',
  'Войти': 'Sign in',
  'Введите email или никнейм, чтобы продолжить.': 'Enter your email or nickname to continue.',
  'Email или никнейм': 'Email or nickname',
  'Пароль': 'Password',
  'Входим...': 'Signing in...',
  'Ещё нет аккаунта?': "Don't have an account yet?",
  'Зарегистрироваться': 'Create account',
  'Совместный календарь, желания, фотографии и маленькие моменты, которые принадлежат только вам двоим.': 'A shared calendar, wishes, photos, and small moments that belong only to the two of you.',
  '♡ Здесь будет ваше общее пространство': '♡ Your shared space will be here',
  'Не удалось выполнить вход': 'Failed to sign in',

  'Создайте ваше пространство для двоих.': 'Create your space for two.',
  'Зарегистрируйтесь, найдите вторую половинку по уникальному никнейму и начните собирать ваши общие моменты.': 'Create an account, find your partner by a unique nickname, and start collecting your shared moments.',
  '♡ Один аккаунт. Одно общее пространство. Только для вас двоих.': '♡ One account. One shared space. Just for the two of you.',
  'Начнём знакомство ♡': "Let's get started ♡",
  'Регистрация': 'Create account',
  'Создайте аккаунт, чтобы присоединиться к «Вдвоём».': 'Create an account to join Вдвоём.',
  'Имя': 'Name',
  'Александр': 'Alex',
  'Уникальный никнейм': 'Unique nickname',
  'Латинские буквы, цифры и _': 'Latin letters, numbers, and _',
  'Минимум 8 символов': 'At least 8 characters',
  'Повторите пароль': 'Repeat password',
  'Создаём аккаунт...': 'Creating account...',
  'Создать аккаунт': 'Create account',
  'Уже есть аккаунт?': 'Already have an account?',
  'Пароли не совпадают': 'Passwords do not match',
  'Не удалось зарегистрироваться': 'Failed to register',

  'Пользователь не найден': 'User not found',
  'Редактировать профиль': 'Edit profile',
  'Отношения': 'Relationship',
  'В отношениях с': 'In a relationship with',
  'Сейчас не состоит в отношениях.': 'Not currently in a relationship.',
  'О пользователе': 'About',
  'День рождения': 'Birthday',
  'Не указан': 'Not specified',
  'В приложении с': 'Joined',
  'Отправляем...': 'Sending...',
  'Пригласить в отношения': 'Invite to relationship',
  '♡ Приглашение отправлено': '♡ Invitation sent',
  'Вам отправлено приглашение': 'You have been invited',
  'Это ваш профиль': 'This is your profile',
  'Вы уже состоите в отношениях': 'You are already in a relationship',
  'Пользователь уже состоит в отношениях': 'This user is already in a relationship',
  'Между вами уже есть приглашение': 'There is already an invitation between you',
  'Приглашение недоступно': 'Invitation unavailable',
  'Не удалось загрузить профиль': 'Failed to load profile',
  'Не удалось отправить приглашение': 'Failed to send invitation',
  'Аватар пользователя {name}': '{name} avatar',

  'Ваш профиль': 'Your profile',
  'Здесь можно изменить информацию, которую видят другие пользователи.': 'Change the information other users can see.',
  'Изменить аватар': 'Change avatar',
  'Изменить фотографию': 'Change photo',
  'JPG, PNG или WEBP, до 5 МБ': 'JPG, PNG or WEBP, up to 5 MB',
  'Как вас называть?': 'What should we call you?',
  'Никнейм': 'Nickname',
  'Только латинские буквы, цифры и нижнее подчёркивание.': 'Latin letters, numbers, and underscore only.',
  'Дата рождения': 'Date of birth',
  'Фотография профиля': 'Profile photo',
  'Выберите миниатюру': 'Choose a thumbnail',
  'Перемещайте фотографию, чтобы выбрать область, которая будет видна в аватаре.': 'Move the photo to choose the area visible in your avatar.',
  'Масштаб фотографии': 'Photo zoom',
  'Перетаскивайте фотографию мышкой и используйте ползунок для изменения масштаба.': 'Drag the photo and use the slider to change the zoom.',
  'Сохранить фото': 'Save photo',
  'Никнейм должен содержать минимум 3 символа': 'Nickname must contain at least 3 characters',
  'Профиль сохранён': 'Profile saved',
  'Не удалось сохранить профиль': 'Failed to save profile',
  'Выберите изображение JPG, PNG или WEBP': 'Choose a JPG, PNG, or WEBP image',
  'Размер изображения не должен превышать 5 МБ': 'Image must be no larger than 5 MB',
  'Аватар обновлён': 'Avatar updated',
  'Не удалось сохранить аватар': 'Failed to save avatar',
  'Не удалось открыть профиль': 'Failed to open profile',
  'Не удалось подготовить изображение': 'Failed to prepare image',
  'Не удалось создать аватар': 'Failed to create avatar',

  'Безопасность': 'Security',
  'Аккаунт и безопасность': 'Account & Security',
  'Управляйте электронной почтой и паролем вашего аккаунта.': 'Manage your account email and password.',
  'Электронная почта': 'Email address',
  'Она используется для входа в аккаунт.': 'It is used to sign in to your account.',
  'Для изменения почты подтвердите действие текущим паролем.': 'Confirm the email change with your current password.',
  'Текущий пароль': 'Current password',
  'Сохранить email': 'Save email',
  'Email сохранён': 'Email saved',
  'Введите корректный email': 'Enter a valid email address',
  'Введите текущий пароль': 'Enter your current password',
  'Не удалось изменить email': 'Failed to change email',
  'Этот email уже используется': 'This email is already in use',
  'Email слишком длинный': 'Email is too long',
  'Смена пароля': 'Change password',
  'Используйте новый пароль не короче 8 символов.': 'Use a new password with at least 8 characters.',
  'Новый пароль': 'New password',
  'Повторите новый пароль': 'Repeat new password',
  'Изменить пароль': 'Change password',
  'Пароль изменён': 'Password changed',
  'Новый пароль должен содержать минимум 8 символов': 'New password must contain at least 8 characters',
  'Пароль не должен быть длиннее 72 символов': 'Password must not be longer than 72 characters',
  'Новый пароль должен отличаться от текущего': 'New password must be different from the current password',
  'Новые пароли не совпадают': 'New passwords do not match',
  'Не удалось изменить пароль': 'Failed to change password',
  'Текущий пароль указан неверно': 'Current password is incorrect',
  'Показать пароль': 'Show password',
  'Скрыть пароль': 'Hide password',

  'Настройки отношений': 'Relationship settings',
  'Здесь можно изменить информацию о ваших отношениях.': 'Change information about your relationship here.',
  'Ваш партнёр': 'Your partner',
  'дней вместе': 'days together',
  'От этой даты считается, сколько дней вы вместе.': 'Your days together are counted from this date.',
  'Сейчас:': 'Current:',
  'Завершение отношений': 'End relationship',
  'После завершения вы больше не будете отображаться как текущая пара. История отношений останется сохранена.': 'After ending the relationship, you will no longer appear as the current couple. Your relationship history will remain saved.',
  'Разорвать отношения': 'End relationship',
  'Разорвать отношения с {name}?': 'End relationship with {name}?',
  'Вы перестанете быть текущей парой в приложении. История этих отношений останется сохранена.': 'You will no longer be the current couple in the app. This relationship history will remain saved.',
  'Завершаем...': 'Ending...',
  'Разорвать': 'End relationship',
  'Нет активных отношений': 'No active relationship',
  'Когда вы создадите пару, здесь появятся настройки ваших отношений.': 'Relationship settings will appear here after you create a couple.',
  'Дата начала отношений обновлена': 'Relationship start date updated',
  'Не удалось изменить дату': 'Failed to update date',
  'Не удалось завершить отношения': 'Failed to end relationship',
  'Не удалось загрузить отношения': 'Failed to load relationship',

  '♡ Желания': '♡ Wishes',
  'Сохраняйте всё, что хотелось бы однажды получить.': 'Save everything you would love to receive someday.',
  'Новый вишлист': 'New wishlist',
  'Мои вишлисты': 'My wishlists',
  'Вишлисты {name}': "{name}'s wishlists",
  'Ваши списки': 'Your lists',
  'Списки {name}': "{name}'s lists",
  'Мой вишлист': 'My wishlist',
  'Вишлист {name}': "{name}'s wishlist",
  'Добавить желание': 'Add wish',
  'Удалить вишлист?': 'Delete wishlist?',
  '«{title}» и все желания внутри него будут удалены.': '“{title}” and all wishes inside it will be deleted.',
  'Удалить желание?': 'Delete wish?',
  '«{title}» исчезнет из этого вишлиста.': '“{title}” will be removed from this wishlist.',
  'Открыть товар': 'Open product',
  'Насколько сильно хочется?': 'How much do you want it?',
  'Приоритет поможет партнёру понять, что хочется больше всего.': 'Priority helps your partner understand what you want most.',
  'Приоритет {priority}': 'Priority {priority}',
  'Предпросмотр изображения': 'Image preview',
  'Заменить': 'Replace',
  'Добавьте изображение': 'Add an image',
  'Ctrl + V, перетаскивание или выбор файла': 'Ctrl + V, drag and drop, or choose a file',
  'Выбрать файл': 'Choose file',
  'Изменить вишлист': 'Edit wishlist',
  'Создать вишлист': 'Create wishlist',
  'Описание': 'Description',
  'Новое желание': 'New wish',
  'Изменить желание': 'Edit wish',
  'Цена': 'Price',
  'Например, наушники': 'For example, headphones',
  'Ссылка на товар': 'Product link',
  'Размер, цвет или любые детали...': 'Size, color, or any details...',
  'Не удалось загрузить вишлисты': 'Failed to load wishlists',
  'партнёра': 'partner',
  'Укажите название вишлиста': 'Enter a wishlist title',
  'Не удалось сохранить вишлист': 'Failed to save wishlist',
  'Не удалось удалить вишлист': 'Failed to delete wishlist',
  'Изображение должно быть не больше 5 МБ': 'Image must be no larger than 5 MB',
  'Укажите название желания': 'Enter a wish title',
  'Цена должна быть целым положительным числом': 'Price must be a positive whole number',
  'Не удалось сохранить желание': 'Failed to save wish',
  'Не удалось удалить желание': 'Failed to delete wish',
  'желание': 'wish',
  'желания': 'wishes',
  'желаний': 'wishes',

  'Найти человека по никнейму...': 'Find someone by nickname...',
  'Ищем...': 'Searching...',
  'Никого не нашли': 'No one found',
  'Переключить тему': 'Toggle theme',

  'Закрыть фотографию': 'Close photo',
  'Фото дня: {name}': "{name}'s photo of the day",
  'с {date}': 'since {date}',
  'Произошла ошибка при обращении к серверу': 'An error occurred while contacting the server',
};

let currentLocale: AppLocale = 'ru';
let languageInitialized = false;

/*
 * Возвращаем значение внутреннего store, а не читаем DOM напрямую.
 *
 * Это принципиально для SSR: сервер и первый клиентский рендер
 * получают одинаковое значение "ru". Уже после гидрации store
 * синхронизируется с localStorage/data-locale.
 */
export function getCurrentLocale(): AppLocale {
  return currentLocale;
}

function getPreferredLocale(): AppLocale {
  if (typeof window === 'undefined') {
    return 'ru';
  }

  /*
   * Скрипт в RootLayout уже мог определить язык до гидрации.
   * Если значение есть в data-locale, используем его первым.
   */
  const documentLocale =
    document.documentElement.dataset.locale;

  if (
    documentLocale === 'ru' ||
    documentLocale === 'en'
  ) {
    return documentLocale;
  }

  try {
    const savedLanguage =
      localStorage.getItem(
        LANGUAGE_STORAGE_KEY,
      );

    if (
      savedLanguage === 'ru' ||
      savedLanguage === 'en'
    ) {
      return savedLanguage;
    }
  } catch {
    /*
     * Если localStorage недоступен,
     * просто переходим к языку браузера.
     */
  }

  const browserLanguage =
    navigator.languages?.[0] ??
    navigator.language ??
    'ru';

  return browserLanguage
    .toLowerCase()
    .startsWith('en')
    ? 'en'
    : 'ru';
}

function applyLocaleToDocument(
  locale: AppLocale,
) {
  if (typeof document === 'undefined') {
    return;
  }

  const root =
    document.documentElement;

  root.dataset.locale =
    locale;

  root.lang =
    locale;
}

/*
 * Вызывается после гидрации через useLanguageVersion.
 * Поэтому смена с серверного "ru" на сохранённый "en"
 * является обычным клиентским обновлением, а не mismatch.
 */
export function initializeCurrentLocale() {
  if (
    typeof window === 'undefined' ||
    languageInitialized
  ) {
    return;
  }

  languageInitialized =
    true;

  const preferredLocale =
    getPreferredLocale();

  const hasChanged =
    currentLocale !==
    preferredLocale;

  currentLocale =
    preferredLocale;

  applyLocaleToDocument(
    preferredLocale,
  );

  if (hasChanged) {
    window.dispatchEvent(
      new Event(
        LANGUAGE_CHANGE_EVENT,
      ),
    );
  }
}

export function getIntlLocale() {
  return getCurrentLocale() === 'en'
    ? 'en-US'
    : 'ru-RU';
}

export function translate(
  source: string,
  params?: Record<string, string | number>,
) {
  const template =
    getCurrentLocale() === 'en'
      ? english[source] ?? source
      : source;

  if (!params) {
    return template;
  }

  return Object.entries(params).reduce(
    (result, [key, value]) =>
      result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export const tr = translate;

export function setCurrentLocale(locale: AppLocale) {
  if (typeof window === 'undefined') {
    return;
  }

  languageInitialized =
    true;

  const hasChanged =
    currentLocale !==
    locale;

  currentLocale =
    locale;

  applyLocaleToDocument(
    locale,
  );

  try {
    localStorage.setItem(
      LANGUAGE_STORAGE_KEY,
      locale,
    );
  } catch {
    /*
     * Сам интерфейс всё равно переключаем,
     * даже если браузер запретил localStorage.
     */
  }

  if (hasChanged) {
    window.dispatchEvent(
      new Event(
        LANGUAGE_CHANGE_EVENT,
      ),
    );
  }
}
