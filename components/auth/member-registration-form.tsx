"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

const COUNTRY_CODES = [
  { code: "+250", country: "Rwanda" },
  { code: "+1", country: "USA/Canada" },
  { code: "+44", country: "UK" },
  { code: "+33", country: "France" },
  { code: "+49", country: "Germany" },
  { code: "+254", country: "Kenya" },
  { code: "+256", country: "Uganda" },
  { code: "+255", country: "Tanzania" },
  { code: "+260", country: "Zambia" },
  { code: "+263", country: "Zimbabwe" },
  { code: "+27", country: "South Africa" },
  { code: "+234", country: "Nigeria" },
  { code: "+251", country: "Ethiopia" },
  { code: "+257", country: "Burundi" },
  { code: "+243", country: "DRC" },
]

export function MemberRegistrationForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    countryCode: "+250",
    phone: "",
    nationalId: "",
    email: "",
    address: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCountryCodeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      countryCode: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Validate required fields
      if (!formData.fullName || !formData.phone || !formData.nationalId) {
        setError("Please fill in all required fields")
        setIsLoading(false)
        return
      }

      // Combine country code with phone number
      const fullPhoneNumber = `${formData.countryCode}${formData.phone}`

      const response = await fetch("/api/members/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          phone: fullPhoneNumber,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to submit registration")
        setIsLoading(false)
        return
      }

      setSubmitted(true)
      setFormData({
        fullName: "",
        countryCode: "+250",
        phone: "",
        nationalId: "",
        email: "",
        address: "",
      })
    } catch (err) {
      setError("An error occurred. Please try again.")
      console.error("[v0] Registration error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
    return (
      <Card className="w-full border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-200">Registration Submitted!</h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                Thank you for registering. Your application is awaiting admin confirmation. You will be notified once it is reviewed.
              </p>
            </div>
            <Button
              onClick={() => setSubmitted(false)}
              variant="outline"
              className="mt-4"
            >
              Register Another Member
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>New Member Registration</CardTitle>
        <CardDescription>
          Join our cooperative association. Fill in your details below to register.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="fullName">
              Full Name *
            </label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="phone">
              Phone Number *
            </label>
            <div className="flex gap-2">
              <Select
                value={formData.countryCode}
                onValueChange={handleCountryCodeChange}
                disabled={isLoading}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Code" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_CODES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.code} ({country.country})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleChange}
                disabled={isLoading}
                required
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="nationalId">
              ID Number *
            </label>
            <Input
              id="nationalId"
              name="nationalId"
              type="text"
              placeholder="Enter your national ID number"
              value={formData.nationalId}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email Address (Optional)
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="address">
              Address (Optional)
            </label>
            <Input
              id="address"
              name="address"
              type="text"
              placeholder="Enter your address"
              value={formData.address}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Registration"
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By registering, you agree to join the cooperative association. Your registration will be reviewed by an administrator.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
