import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

export const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  //validation - not empty
  //check if user already exist
  //check for image , avatar
  //if avatar, upload it on cloudinary
  //create user object = create entry in db
  //remove password and other unneccessary info. from response
  //check if user is createddd or not
  //return res

  try {
    const { username, email, fullname, password } = req.body;
    if (
      [username, email, fullname, password].some(
        (field) => field?.trim() === ""
      )
    ) {
      console.log("All fields are required");
      throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (existedUser) {
    //   console.log("Existing user : ", existedUser);
      throw new ApiError(409, "User already exist with email or username");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar image required");
    }

    const cloudAvatarUrl = await uploadOnCloudinary(avatarLocalPath);
    const cloudCoverImageUrl = await uploadOnCloudinary(coverImageLocalPath);

    if (!cloudAvatarUrl) {
      throw new ApiError(404, "Try again! avatar image not uploaded");
    }

    const user = await User.create({
      username: username?.toLowerCase(),
      fullname,
      avatar: cloudAvatarUrl?.secure_url,
      coverImage: cloudCoverImageUrl?.secure_url || "",
      email,
      password,
    });

    const userCreated = await User.findById(user._id).select("-password -refreshToken");

    if(!userCreated){
      throw new ApiError(500, "Something went wrong while creating user"); 
    }

    return res.status(201).json(
        new ApiResponse(200, userCreated, "Registration successfull!")
    )


  } catch (error) {
    console.error("Registration error:", error);
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(500).json({
      message: "Internal server error..",
    });
  }
});
