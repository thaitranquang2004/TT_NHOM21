import React, { useState } from "react"; // ← Thêm useState cho isSubmitting
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import api from "../utils/api";
import "./Login.css";

const Register = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false); // ← Thêm loading state

  // Schema sync backend, fix dob handle empty string
  const schema = yup.object({
    username: yup
      .string()
      .required("Username required")
      .min(3, "Min 3 characters"),
    password: yup
      .string()
      .required("Password required")
      .min(8, "Min 8 characters"),
    fullName: yup.string().required("Full Name required"),
    email: yup
      .string()
      .required("Email required")
      .email("Invalid email format"),
    phone: yup.string().optional(),
    dob: yup
      .string() // ← Đổi sang string để handle empty ""
      .optional()
      .nullable()
      .test("is-valid-date", "Invalid date", function (value) {
        if (!value || value === "") return true; // Empty OK (optional)
        const date = new Date(value); // YYYY-MM-DD from <input type="date">
        return !isNaN(date.getTime()) && date <= new Date(); // Valid & not future
      })
      .transform((value) => (value && value !== "" ? value : undefined)), // Clean to undefined
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
  });

  // ← Thêm onInvalid để debug khi validation fail
  const onInvalid = (validationErrors) => {
    console.error("Validation failed:", validationErrors); // Log errors cụ thể
    alert("Please fix form errors before submitting!"); // UX feedback
  };

  const onSubmit = async (data) => {
    console.log("onSubmit triggered!"); // ← Debug log
    setIsSubmitting(true);
    const payload = {
      ...data,
      phone: data.phone || undefined,
      dob: data.dob || undefined,
    };
    console.log("Clean payload:", payload);

    try {
      await api.post("/auth/register", payload);
      alert("Register success! Please check email confirmation & login.");
      reset();
      navigate("/");
    } catch (error) {
      console.error("Full error:", error.response?.data);
      const backendMsg =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.msg ||
        error.message;
      alert(`Register failed: ${backendMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ← Log errors real-time để debug
  console.log("Current errors:", errors);

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="login-form">
        {" "}
        {/* ← Thêm onInvalid */}
        <h1 className="login-title">Band M Register</h1>
        <div className="input-group">
          <input
            type="text"
            placeholder="Username"
            {...register("username")}
            className={`login-input ${errors.username ? "error" : ""}`}
          />
          {errors.username && (
            <span className="error-text">{errors.username.message}</span>
          )}
        </div>
        <div className="input-group">
          <input
            type="password"
            placeholder="Password (min 8)"
            {...register("password")}
            className={`login-input ${errors.password ? "error" : ""}`}
          />
          {errors.password && (
            <span className="error-text">{errors.password.message}</span>
          )}
        </div>
        <div className="input-group">
          <input
            type="text"
            placeholder="Full Name"
            {...register("fullName")}
            className={`login-input ${errors.fullName ? "error" : ""}`}
          />
          {errors.fullName && (
            <span className="error-text">{errors.fullName.message}</span>
          )}
        </div>
        <div className="input-group">
          <input
            type="email"
            placeholder="Email"
            {...register("email")}
            className={`login-input ${errors.email ? "error" : ""}`}
          />
          {errors.email && (
            <span className="error-text">{errors.email.message}</span>
          )}
        </div>
        <div className="input-group">
          <input
            type="tel"
            placeholder="Phone (optional)"
            {...register("phone")}
            className="login-input"
          />
          {errors.phone && (
            <span className="error-text">{errors.phone.message}</span>
          )}
        </div>
        <div className="input-group">
          <input type="date" {...register("dob")} className="login-input" />
          {errors.dob && (
            <span className="error-text">{errors.dob.message}</span>
          )}
        </div>
        <button
          type="submit"
          className="login-button"
          disabled={isSubmitting} // ← Chỉ disable khi submitting, không dựa errors
        >
          {isSubmitting ? "Registering..." : "Register"}
        </button>
        <div className="form-footer">
          <span className="footer-text">
            Đã có tài khoản?{" "}
            <Link to="/" className="footer-link">
              Đăng nhập
            </Link>
          </span>
        </div>
      </form>
    </div>
  );
};

export default Register;
