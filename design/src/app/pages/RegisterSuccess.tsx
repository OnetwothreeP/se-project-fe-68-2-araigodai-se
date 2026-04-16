import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { CheckCircle } from "lucide-react";

export default function RegisterSuccess() {
  const navigate = useNavigate();
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleContinue = () => {
    // Token is already saved during registration
    navigate("/hotels");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-green-500 p-3 rounded-full">
              <CheckCircle className="size-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Registration Successful!</CardTitle>
          <CardDescription className="text-center">
            Your account has been created successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
            />
            <div className="space-y-1 leading-none">
              <Label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                I agree to the Terms and Conditions
              </Label>
              <p className="text-sm text-gray-500">
                By continuing, you accept our terms of service and privacy policy
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleContinue}
            className="w-full"
            disabled={!agreedToTerms}
          >
            Continue to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
