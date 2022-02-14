import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import fr from 'dayjs/locale/fr'

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault('Europe/Paris');

dayjs.locale(fr);

export default dayjs;
