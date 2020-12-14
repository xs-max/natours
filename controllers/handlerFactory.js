const catchAsync = require('./../utils/cactchAsync');
const AppError = require('./../utils/appError');
const ApiFeatures = require('./../utils/apiFeatures');

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
        return next(new AppError('No document found with that ID', 404));
    }
        res.status(204).json({
            status: 'success',
            data: null
        })
    // try{
        
    // }catch(err){
    //     res.status(400).json({
    //         status: 'failed',
    //         message: err
    //     })
    // }
    
});

exports.updateOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    if (!doc) {
        return next(new AppError('No document found with that ID', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            data: doc
        }
    }) 
    // try{
        
    // }catch (err) {
    //     res.status(400).json({
    //         status: 'failed',
    //         message: err
    //     })
    // }
    
});

exports.createOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

        res.status(201).json({
            status: 'success',
            data: {
                data : doc
            }
        });
    // try{
        
    // }catch (err) {
    //     res.status(404).json({
    //         status: 'failed',
    //         message: 'Invalid Data sent'
    //     })
    // }
   
});

exports.getOne = (Model, popOtions) => catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if(popOtions) query = query.populate(popOtions);
    const doc = await query;
    if (!doc) {
        return next(new AppError('No document found with that ID', 404));
    }
        res.status(200).json({
            status: 'success',
            data: {
                data: doc
            }
        })
    // try {
        
    // }catch (err) {
    //     res.status(404).json({
    //         status: 'failed',
    //         message: 'Ivalid ID'
    //     })
    // }
    
});

exports.getAll = Model => catchAsync(async (req, res, next) => {
    // to allow for nested get reviews on tour
    let filter = {};
    if(req.params.tourId) filter = {tour: req.params.tourId};
        // Execute query
        const features = new ApiFeatures(Model.find(filter), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
        // const doc = await features.query.explain();  
        const doc = await features.query;  

        //Send Response
        res.status(200).json({
            status: 'success',
            results: doc.length,
            data: {
                data: doc
            }
        })
    // try{
        
    // }catch (err) {
    //     res.status(404).json({
    //         status: 'failed',
    //         message: err.message
    //     })
    // }
    
});