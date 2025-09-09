import { redirect } from 'next/navigation';

export default function Home() {
  // Перенаправляем на страницу звонков
  redirect('/calls');
}
