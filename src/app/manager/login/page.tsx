import { redirect } from 'next/navigation';

export default function ManagerLoginPage() {
  redirect('/portal?redirect=/manager/orders');
}
