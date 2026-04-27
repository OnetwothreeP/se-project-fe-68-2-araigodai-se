"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Hotel } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface RegisterFormData {
  name: string;
  telephone: string;
  email: string;
  password: string;
}

const PRIVACY_POLICY = `araigodai group project ("Application," "we," "us," or "our") is a hotel room rental platform that enables customers to search, book, and manage hotel accommodations online. We are committed to protecting your personal information and your right to privacy.

1. INTRODUCTION

This project respects your right to privacy and gives the highest importance to protecting your personal data. This Privacy Policy is prepared to inform you of our practices for collecting, using, and disclosing your personal information, the purposes for which such data is used, and the methods by which it is managed.

This policy applies to all services provided through our website, mobile application, social media channels, and other platforms. It does not apply to employees or job applicants of this project. By continuing to use our services, you acknowledge that you have read and agreed to this Privacy Policy.

2. INFORMATION WE COLLECT

Information You Provide Directly:
• Full name, email address, and phone number
• Password (stored as a bcrypt hash — never in plain text)
• Billing address and payment details (via PCI-DSS-compliant gateway; full card numbers are not stored)
• Hotel preferences, special requests, and booking details

Information Collected Automatically:
• Booking history, check-in/check-out dates, and transaction records
• Device identifiers (Device ID, OS version, app version)
• IP address and approximate location (city/region level)
• Usage logs: pages visited, search queries, session duration
• Cookies and similar tracking technologies for session management

3. HOW WE USE YOUR INFORMATION

• Process hotel bookings and payments — Contract
• Send booking confirmations and receipts — Contract
• Provide customer support and resolve disputes — Contract
• Personalize search results and recommendations — Legitimate Interest
• Improve application features and fix bugs — Legitimate Interest
• Generate analytics and occupancy reports for hotels — Legitimate Interest
• Send promotional offers and newsletters — Consent (Opt-in)
• Comply with legal obligations (e.g., tax records) — Legal Obligation

4. DATA SHARING & DISCLOSURE

We share personal data only to the extent necessary and only with the following parties:
• Hotels / Property Partners — Guest name, contact, booking details (Fulfilling the reservation)
• Payment Gateway Providers — Payment transaction data only (Processing secure payments)
• Cloud Infrastructure — Encrypted application data (Hosting and data storage)
• Government / Regulatory — As required by law (Legal compliance)

We do NOT sell, rent, or trade your personal data to third parties for marketing purposes.

5. DATA RETENTION

• Account and profile information: Duration of account + 3 years after closure
• Booking and transaction records: 5 years (tax and audit compliance)
• Payment data: Retained by gateway; not stored by us
• Usage logs and access logs: Maximum 90 days, then auto-deleted
• Marketing consent records: Until consent withdrawn + 1 year

6. SECURITY MEASURES

We implement industry-standard security controls to protect your personal data:
• All data in transit is encrypted using HTTPS / TLS 1.2+
• Passwords are hashed using bcrypt with salting
• Authentication uses JWT / OAuth 2.0 with token expiration
• Database access is restricted by role-based access control (RBAC)
• Regular penetration testing and vulnerability assessments are conducted
• Cloud infrastructure is configured with encryption at rest

7. YOUR PRIVACY RIGHTS

• Right to Access — Request a copy of the personal data we hold about you.
• Right to Rectification — Correct inaccurate or incomplete data.
• Right to Withdraw Consent — Withdraw marketing consent at any time without affecting other services.
• Right to Object — Object to processing for direct marketing or profiling.
• Right to Data Portability — Receive your data in a structured, machine-readable format.
• Right to Complain — File a complaint with the relevant data protection authority.

To exercise any of these rights, contact us at: privacy@araigodai.mock
We will respond within 30 days of receiving your request.

8. COOKIES & TRACKING TECHNOLOGIES

We use cookies and similar technologies for session management, security, and analytics. You can control cookie preferences through your browser settings.

• Essential Cookies — Login session and security tokens (Cannot be disabled)
• Analytics Cookies — Usage statistics and performance (Opt-out available)
• Marketing Cookies — Personalized promotions (Opt-out available)

9. CHILDREN'S PRIVACY

araigodai project is not directed at individuals under the age of 18. We do not knowingly collect personal data from minors. If you believe a minor has provided us with personal information, please contact us and we will delete it promptly.

10. CHANGES TO THIS POLICY

We may update this Privacy Policy from time to time. When we make significant changes, we will notify you via:
• An in-app notification at least 30 days before the changes take effect
• An email to the address registered with your account

Continued use of the application after the effective date constitutes acceptance of the updated policy.

11. CONTACT US

Application    : araigodai
Privacy Email  : privacy@araigodai.mock
Support Email  : support@araigodai.mock
Response Time  : Within 30 days of receiving your request

araigodai project · Effective: April 27, 2025 · Last updated: April 2025`;

export default function Register() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const onSubmit = async (data: RegisterFormData) => {
    if (!acceptedTerms) {
      setTermsError(true);
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const result = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (result.token) {
        localStorage.setItem("token", result.token);
      }

      router.push("/register-success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Hotel className="size-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Create an account</CardTitle>
          <CardDescription className="text-center">
            Enter your details to register for Hotel Booking System
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 mb-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                {...register("name", { required: "Name is required" })}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephone">Telephone</Label>
              <Input
                id="telephone"
                type="tel"
                placeholder="0888888888"
                {...register("telephone", { required: "Telephone is required" })}
                className={errors.telephone ? "border-red-500" : ""}
              />
              {errors.telephone && <p className="text-sm text-red-500">{errors.telephone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 6, message: "Password must be at least 6 characters" },
                })}
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>

            {/* Terms & Conditions checkbox */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => {
                    setAcceptedTerms(checked === true);
                    if (checked) setTermsError(false);
                  }}
                  className={termsError ? "border-red-500" : ""}
                />
                <label htmlFor="terms" className="text-sm text-gray-600 leading-snug cursor-pointer">
                  I have read and agree to the{" "}
                  <button
                    type="button"
                    onClick={() => setPrivacyOpen(true)}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Privacy Policy & Terms of Service
                  </button>
                </label>
              </div>
              {termsError && (
                <p className="text-sm text-red-500 pl-7">
                  You must accept the Terms & Conditions to register.
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
            <p className="text-sm text-center text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      {/* Privacy Policy Dialog */}
      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Privacy Policy & Terms of Service</DialogTitle>
            <DialogDescription>
              araigodai · Effective: April 27, 2025
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
              {PRIVACY_POLICY}
            </pre>
          </ScrollArea>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setPrivacyOpen(false)}>
              Close
            </Button>
            <Button onClick={() => { setAcceptedTerms(true); setTermsError(false); setPrivacyOpen(false); }}>
              I Accept
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
