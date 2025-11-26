const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
    const token = req.cookies.token;
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'No autorizado. Debes iniciar sesión.' 
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token inválido o expirado' 
        });
    }
};

const requireRole = (...roles) => {
    return (req, res, next) => {
        const token = req.cookies.token;
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No autorizado' 
            });
        }
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            
            if (!roles.includes(decoded.rol)) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'No tienes permisos para realizar esta acción' 
                });
            }
            
            next();
        } catch (error) {
            return res.status(401).json({ 
                success: false, 
                message: 'Token inválido o expirado' 
            });
        }
    };
};

module.exports = {
    requireAuth,
    requireRole
};
