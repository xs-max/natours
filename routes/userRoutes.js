const express = require('express');
const {resizeUserPhoto, uploadUserPhoto, getAllUsers, createUser, getUser, updateUser, deleteUser, updateMe, deleteMe, getMe} = require('./../controllers/userController');
const {logout, signUp, login, forgotPassword, resetPassword, protect, updatePassword, restrictTo} = require('./../controllers/authController');


const router = express.Router();

router.post('/signup', signUp);
router.post('/login', login);
router.get('/logout', logout);

router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

// Protect all route after this middleware
router.use(protect);

router.patch('/updateMyPassword', updatePassword);
router.get('/me', getMe, getUser)
router.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMe);
router.delete('/deleteMe', deleteMe);

// Restrict routes to admin only
router.use(restrictTo('admin'));

router.route('/')
    .get(getAllUsers)
    .post(createUser);

router.route('/:id')
    .get(getUser)
    .patch(updateUser)
    .delete(deleteUser);

    module.exports = router;