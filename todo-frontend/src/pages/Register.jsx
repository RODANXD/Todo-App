import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosinstance from '../api/AxiosAuth';
import background from '../assets/background.jpg';
import loginbg from '../assets/loginbg.webp';
import { toast } from "sonner";
import {Eye, EyeOff} from "lucide-react"
import { Button } from '../components/ui/button';



export default function Register() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [touch, setTouch] = useState(false);


    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        password: '',
        password_confirm: '',
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        console.log('Form data being sent:', form); // Debugging form data
        try {
            await axiosinstance.post('auth/register/', form);
            toast.success("Registration successful! Please log in.");
            navigate('/login');
        } catch (error) {
            toast.error("Registration failed.");
            console.error('Registration failed:', error.response || error); // Log full error
            if (error.response) {
                toast.error(`Registration failed: ${error.response.data.detail || 'Please check your input'}`);
                // alert(`Registration failed: ${error.response.data.detail || 'Please check your input'}`);
            } else {
                toast.error("Registration failed. Please check your connection.");
                // alert('Registration failed. Please check your connection.');
            }
        }
    };

    const HandleConfirmpassword = (e) => {
        if (form.password !== form.password_confirm) {
            toast.error("Passwords do not match");
            // alert("Passwords do not match");
            return false;
        }
        return true;
    };
  const passwordmatch = form.password===form.password_confirm;


    return (
        <div className="min-h-screen flex items-center justify-center p-2">
            <div className="flex justify-center items-center w-full max-w-6xl bg-white rounded-2xl shadow-xl p-8">
                <div className="w-full max-w-md p-6 bg-white rounded-lg">
                    <div className="text-center mb-6">
                        <h2 className="text-4xl font-bold text-gray-900">Create an Account</h2>
                        <p className="text-gray-500 mt-2">Sign up to get started</p>
                    </div>
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="flex gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    onChange={handleChange}
                                    className="w-full bg-gray-100 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Enter your First Name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    onChange={handleChange}
                                    className="w-full bg-gray-100 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Enter your Last Name"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <input
                                type="text"
                                name="username"
                                onChange={handleChange}
                                className="w-full bg-gray-100 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Enter your username"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                name="email"
                                onChange={handleChange}
                                className="w-full bg-gray-100 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div className='flex items-center '>
                            <input
                                type={showCurrentPassword ? "text" : "password"}
                                name="password"
                                onChange={handleChange}
                                className="w-full bg-gray-100 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Enter your password"
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className=" relative right-8 h-6 w-1 p-0"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                                {showCurrentPassword ? <EyeOff className=" w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                            <div className='flex items-center '>
                            <input
                                type={showConfirmPassword?"text":"password"}
                                name="password_confirm"
                                onChange={handleChange}
                                className="w-full bg-gray-100 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Confirm your password"
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className=" relative right-8 h-6 w-1 p-0"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff className=" w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                        </div>
                        {form.password_confirm && (
    <p
      className={`text-sm mt-1 ${
        passwordmatch ? "text-green-600" : "text-red-500"
      }`}
    >
      {passwordmatch ? "✅ Passwords match" : "❌ Passwords do not match"}
    </p>
  )}
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            Register
                        </button>
                    </form>
                    <p className="mt-4 text-sm text-center text-gray-600">
                        Already have an account? <a href="/login" className="text-purple-600 hover:text-purple-500">Login here</a>
                    </p>
                </div>
                <div className="w-2/5 ml-8">
                    <img src={loginbg} alt="Register Illustration" className="w-full rounded-lg aspect-3/2 object-cover" />
                </div>
            </div>
        </div>
    );
}