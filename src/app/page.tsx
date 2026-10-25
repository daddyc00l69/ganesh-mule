import { redirect } from 'next/navigation';

/**
 * Root Home Page:
 * Per store requirements, visiting the root URL immediately directs customers to the flagship /shop catalogue.
 */
export default function HomePage() {
  redirect('/shop');
}
