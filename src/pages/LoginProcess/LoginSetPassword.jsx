import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";

import { useLocation } from "react-router-dom";

export default function SetPasswordPage() {
  const location = useLocation();
  const { email } = location.state ?? {};



  if (!email) return <p>Email not provided!</p>;
    
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  async function handleSetPassword(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    

    try {
      // Create Auth user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });


      if (signUpError) throw signUpError;

      // Store auth_user_id in person table
      await supabase
        .from("person")
        .update({ auth_user_id: data.user.id })
        .eq("email", email);

      alert(
        "Password set! Please check your email to verify your account before logging in."
      );
      navigate("/login");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Set Password</h1>
      <p className="mb-4">Email: {email}</p>

      <form onSubmit={handleSetPassword} className="space-y-4">
        <input
          type="password"
          placeholder="Enter your password"
          className="w-full border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded"
          disabled={loading}
        >
          {loading ? "Setting password..." : "Set Password"}
        </button>
      </form>

      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
}