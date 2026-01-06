"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { registerTeam } from "@/lib/user-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchSelect } from "@/components/ui/search-select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { motion } from "framer-motion";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full bg-linear-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                </>
            ) : (
                "Create Account"
            )}
        </Button>
    );
}

const initialState = {
    error: "",
    fieldErrors: {} as Record<string, string[] | undefined>,
};

export function RegisterTeamForm() {
    const [state, formAction] = useActionState(registerTeam, initialState);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl mx-auto"
        >
            <Card className="border-white/10 bg-black/40 backdrop-blur-xl text-white shadow-2xl">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-fuchsia-400 to-purple-400">
                        Institute Registration
                    </CardTitle>
                    <CardDescription className="text-white/60">
                        Register your institution to participate in Hifz Fest 2.0
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-6">

                        {state?.error && (
                            <Alert variant="destructive" className="bg-red-500/10 border-red-500/50 text-red-500">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{state.error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Institute Details */}
                            <div className="space-y-4 md:col-span-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">College Name</Label>
                                    <SearchSelect
                                        name="name"
                                        placeholder="Select College..."
                                        options={[
                                            { label: "Shihab Thangal Thahfeezul Quran College", value: "Kannyala College" },
                                            { label: "Sayyid Muhammedali Shihab Thangal Thahfeezul Quran College", value: "Pazamallur College" },
                                            { label: "Hafiz Mammu Molla College Of Thahfeezul Quran", value: "Puthanpalli" },
                                            { label: "Panakkad Shihab Thangal & Shamsul Ulama Memorial Hifzul Quran College", value: "Kottakkunnu College" },
                                            { label: "Darul Azhar Islamic Academy", value: "Koduvalli College" },
                                            { label: "Darul Quran Islamic Academy", value: "Purang College" },
                                            { label: "Darussalam Thahfeezul Quran College", value: "Indianoor College" },
                                            { label: "Muhammediyya Hifzul Quran College", value: "Kunil College" },
                                            { label: "KMO Hifz College", value: "Karulayi College" },
                                            { label: "Thahfeezul Quran College", value: "Perinthalmanna College" },
                                            { label: "Siddeeqiyya Hifzul Quran College", value: "Anakkayam College" },
                                        ]}
                                        className="w-full"
                                        required
                                    />
                                    {state?.fieldErrors?.name && (
                                        <p className="text-xs text-red-400">{state.fieldErrors.name[0]}</p>
                                    )}
                                </div>
                            </div>

                            {/* Location */}
                            <div className="space-y-2">
                                <Label htmlFor="place">Place</Label>
                                <Input
                                    id="place" name="place"
                                    placeholder="e.g. Malappuram"
                                    className="bg-white/5 border-white/10 focus-visible:ring-fuchsia-500"
                                    required
                                />
                                {state?.fieldErrors?.place && (
                                    <p className="text-xs text-red-400">{state.fieldErrors.place[0]}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="district">District</Label>
                                <SearchSelect
                                    name="district"
                                    placeholder="Select District..."
                                    options={[
                                        { label: "Kasaragod", value: "Kasaragod" },
                                        { label: "Kannur", value: "Kannur" },
                                        { label: "Wayanad", value: "Wayanad" },
                                        { label: "Kozhikode (Calicut)", value: "Kozhikode" },
                                        { label: "Malappuram", value: "Malappuram" },
                                        { label: "Palakkad", value: "Palakkad" },
                                        { label: "Thrissur", value: "Thrissur" },
                                        { label: "Ernakulam", value: "Ernakulam" },
                                        { label: "Idukki", value: "Idukki" },
                                        { label: "Kottayam", value: "Kottayam" },
                                        { label: "Alappuzha", value: "Alappuzha" },
                                        { label: "Pathanamthitta", value: "Pathanamthitta" },
                                        { label: "Kollam", value: "Kollam" },
                                        { label: "Thiruvananthapuram", value: "Thiruvananthapuram" },
                                    ]}
                                    className="w-full"
                                    required
                                />
                                {state?.fieldErrors?.district && (
                                    <p className="text-xs text-red-400">{state.fieldErrors.district[0]}</p>
                                )}
                            </div>

                            {/* Principal Info */}
                            <div className="space-y-2">
                                <Label htmlFor="principal_name">Team Manager's Name</Label>
                                <Input
                                    id="principal_name" name="principal_name"
                                    placeholder="Full Name"
                                    className="bg-white/5 border-white/10 focus-visible:ring-fuchsia-500"
                                    required
                                />
                                {state?.fieldErrors?.principal_name && (
                                    <p className="text-xs text-red-400">{state.fieldErrors.principal_name[0]}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="principal_phone">Team Manager's Phone</Label>
                                <Input
                                    id="principal_phone" name="principal_phone" type="tel"
                                    defaultValue="+91 "
                                    className="bg-white/5 border-white/10 focus-visible:ring-fuchsia-500"
                                    required
                                />
                                {state?.fieldErrors?.principal_phone && (
                                    <p className="text-xs text-red-400">{state.fieldErrors.principal_phone[0]}</p>
                                )}
                            </div>

                            {/* Contacts */}
                            <div className="space-y-2">
                                <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                                <Input
                                    id="whatsapp_number" name="whatsapp_number" type="tel"
                                    defaultValue="+91 "
                                    className="bg-white/5 border-white/10 focus-visible:ring-fuchsia-500"
                                    required
                                />
                                {state?.fieldErrors?.whatsapp_number && (
                                    <p className="text-xs text-red-400">{state.fieldErrors.whatsapp_number[0]}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="union_official_number">Union Official Number (Optional)</Label>
                                <Input
                                    id="union_official_number" name="union_official_number" type="tel"
                                    defaultValue="+91 "
                                    className="bg-white/5 border-white/10 focus-visible:ring-fuchsia-500"
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password">Create Password</Label>
                                <Input
                                    id="password" name="password" type="password"
                                    placeholder="Min 6 characters"
                                    className="bg-white/5 border-white/10 focus-visible:ring-fuchsia-500"
                                    required
                                />
                                {state?.fieldErrors?.password && (
                                    <p className="text-xs text-red-400">{state.fieldErrors.password[0]}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword" name="confirmPassword" type="password"
                                    className="bg-white/5 border-white/10 focus-visible:ring-fuchsia-500"
                                    required
                                />
                                {state?.fieldErrors?.confirmPassword && (
                                    <p className="text-xs text-red-400">{state.fieldErrors.confirmPassword[0]}</p>
                                )}
                            </div>
                        </div>

                        <SubmitButton />
                    </form>
                </CardContent>
                <CardFooter className="justify-center border-t border-white/10 pt-6">
                    <p className="text-sm text-white/60">
                        Already registered?{" "}
                        <Link href="/team/login" className="text-fuchsia-400 hover:text-fuchsia-300 font-medium hover:underline">
                            Login to Team Portal
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </motion.div >
    );
}
