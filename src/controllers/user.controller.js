import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Somthing went wrong while generating tokens");
  }
};

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

    const userCreated = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!userCreated) {
      throw new ApiError(500, "Something went wrong while creating user");
    }

    return res
      .status(201)
      .json(new ApiResponse(200, userCreated, "Registration successfull!"));
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

export const loginUser = asyncHandler(async (req, res) => {
  try {
    //frontend login input recieve karenge
    //db me check karenge user exist krta h ki nhi
    //agar user exist krta h to agea proceed karenge
    //password check
    //access  and refresh token
    // send cookie
    const { email, username, password } = req.body;
    const user = await User.findOne({
      $or: [{ email }, { username }],
    })

    if (!email && !username) {
      throw new ApiError(400, "Username or email is required");
    }

    if (!user) {
      return new ApiError(404, "User does not exist");
    }

    const isPassworMatched = await user.isPasswordCorrect(password);

    if (!isPassworMatched) {
      return new ApiError(401, "Invalid credentials!");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: loggedInUser,
            accessToken,
            refreshToken,
          },
          "Logged in successfully!"
        )
      );
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(500).json({
      message: "Internal server error..",
    });
  }
});

export const logoutUser = asyncHandler(async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          refreshToken: null,
        },
      },
      {
        new: true,
      }
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(
      new ApiResponse(200, {}, "Logged out succesfully!")
    )


  } catch (error) {
    return ApiError(500, "Somthing went wrong while logging out")
  }
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if(!incomingRefreshToken){
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id);


    if(!user){
      throw new ApiError(401, "Invalid refresh token");
    }

    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401, "Refresh token expired or invalid");
    }

    const options = {
      httpOnly : true,
      secure : true
    }

    const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user?._id);

    return res
    .status(200)
    .cookie("accessToken", accessToken , options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
      new ApiResponse(200, {accessToken, refreshToken : newRefreshToken}, "Access token refreshed!")
    )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token...")
  }
})
