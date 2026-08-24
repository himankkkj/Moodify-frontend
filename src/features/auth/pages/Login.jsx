import React from 'react'

const Login = () => {
  return (
    <main>
        <div className="form-container">
            <h1>Login</h1>
            <form>
                <input name="email" type="email" placeholder="Email" />
                <input name="password" type="password" placeholder="Password" />
                <button type="submit">Login</button>
            </form>
        </div>
    </main>
  )
}

export default Login
