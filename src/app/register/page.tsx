"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, UtensilsCrossed, ChefHat, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const registerSchema = z
    .object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string(),
        restaurantName: z.string().min(3, "Restaurant name is required"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
            restaurantName: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof registerSchema>) => {
        setLoading(true);
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Something went wrong");
            }

            toast.success("Account created successfully! Please login.");
            router.push("/login?registered=true");
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("An unexpected error occurred");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-black text-white selection:bg-orange-500/30">
            {/* Left Column - Form */}
            <div className="flex items-center justify-center p-8 lg:p-12 order-2 lg:order-1 relative z-10">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left space-y-2">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-xl font-bold text-white hover:text-orange-500 transition-colors"
                        >
                            <div className="p-2 bg-orange-500/10 rounded-xl border border-orange-500/20">
                                <UtensilsCrossed className="w-6 h-6 text-orange-500" />
                            </div>
                            Servora
                        </Link>
                    </div>

                    <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl shadow-2xl">
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-2xl font-bold text-center lg:text-left text-white">
                                Create an account
                            </CardTitle>
                            <CardDescription className="text-zinc-400 text-center lg:text-left">
                                Start managing your restaurant today
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-zinc-300">Full Name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="John Doe"
                                                        className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-orange-500/50"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-red-400" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="restaurantName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-zinc-300">Restaurant Name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Tasty Bites"
                                                        className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-orange-500/50"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-red-400" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-zinc-300">Email</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="name@example.com"
                                                        type="email"
                                                        className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-orange-500/50"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-red-400" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-zinc-300">Password</FormLabel>
                                                <div className="relative">
                                                    <FormControl>
                                                        <Input
                                                            placeholder="••••••••"
                                                            type={showPassword ? "text" : "password"}
                                                            className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-orange-500/50 pr-10"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                                    >
                                                        {showPassword ? (
                                                            <EyeOff className="w-4 h-4" />
                                                        ) : (
                                                            <Eye className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                                <FormMessage className="text-red-400" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-zinc-300">Confirm Password</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="••••••••"
                                                        type="password"
                                                        className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-orange-500/50"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-red-400" />
                                            </FormItem>
                                        )}
                                    />

                                    <Button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold h-11 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-orange-500/20"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            "Create Account"
                                        )}
                                    </Button>
                                </form>
                            </Form>

                            <div className="mt-6">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <Separator className="bg-zinc-800" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-zinc-900 px-2 text-zinc-500">
                                            Already have an account?
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 text-center">
                                    <Link
                                        href="/login"
                                        className="text-sm text-orange-400 hover:text-orange-300 hover:underline font-medium transition-colors"
                                    >
                                        Sign in to your dashboard
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Right Column - Visual */}
            <div className="hidden lg:flex flex-col justify-center items-center relative p-12 overflow-hidden bg-zinc-900 order-1 lg:order-2">
                {/* Background Gradients */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.15),transparent_40%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(217,70,239,0.1),transparent_40%)]" />

                <div className="relative max-w-xl mx-auto text-center space-y-8 z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <div className="inline-flex items-center justify-center p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700/50 mb-8 backdrop-blur-sm shadow-2xl">
                            <ChefHat className="w-12 h-12 text-orange-400" />
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-zinc-500 tracking-tight leading-tight">
                            Join the future of
                            <br />
                            Kitchen Management
                        </h1>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-lg text-zinc-400 leading-relaxed max-w-lg mx-auto"
                    >
                        Servora empowers restaurants with real-time analytics, inventory tracking,
                        and seamless order management. Start your free trial today.
                    </motion.p>
                </div>
            </div>
        </div>
    );
}
