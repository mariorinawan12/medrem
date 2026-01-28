const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key"; // Ensure this matches the one in login/signup


const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      console.error("JWT Error:", err);
      return res.status(401).json({ error: "Invalid token" });
    }

    console.log("✅ Decoded JWT:", decoded); // Debugging log

    req.user = decoded; // Ensure req.user is correctly assigned
    next();
  });
};

module.exports = authenticate;

  
module.exports = authenticate;
