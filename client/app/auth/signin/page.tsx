import { redirect } from 'next/navigation'

export default function SignInPage() {
  // Redirect to the login page
  redirect('/auth/login')
}
