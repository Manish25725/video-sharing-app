
const asyncHandler =(requestHandler)=>{
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((error)=>next(error));
    };
};






export {asyncHandler}



//const asyncHandler=()=>{}
//const asyncHandler=(func)=>{()=>{}}
//const asyncHandler = (func)=>()=>{}
//const asyncHandler =(func)=> async()=>{}


// const asyncHandler =(func) => async (req,res,next) => {

//     try{
//         await(req,res,next);
//     }
//     catch(error){
//         res.status(error.code || 500).json({
//             success:false,
//             message:error.message
//         });
//     }
// };
