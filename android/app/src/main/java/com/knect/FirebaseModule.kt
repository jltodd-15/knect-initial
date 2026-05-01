package com.knect
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

import com.knect.services.DBService

import com.facebook.react.bridge.*

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await

class FirebaseModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    // needed for native modules
    override fun getName() = "FirebaseModule";

    private var ActiveUser: UserSchema? = null;
    private var dbConnection: DBService = DBService();
    private var auth: FirebaseAuth = FirebaseAuth.getInstance();
    private lateinit var authState: FirebaseAuth.AuthStateListener;

    private val debug: Boolean = true;

    data class UserSchema(
        val userId: String?,
        val displayName: String,
        val email: String,
        val profilePictureUrl: String?,
        val interests: Array<String>?,
    );

    init {
        // debug configs
        if (debug){
            auth.useEmulator("10.0.2.2", 8080);
            dbConnection.dbConnect("default", true);
        }
    }

    // cannot use suspend methods for TurboReactNative modules
//    @ReactMethod
//    suspend fun createNewUser(email: String, password: String, promise: Promise) {
//        val authState = auth.createUserWithEmailAndPassword(email, password);
//        if (authState.await().user == null) {
//            promise.resolve(false);
//        }
//        promise.resolve(true);
//    }

    @ReactMethod
    fun createUserData(displayName: String, email: String, promise: Promise) {
        try {
            val newUser = UserSchema (
                auth.currentUser?.uid,
                displayName,
                email,
                "",
                arrayOf()
            )
            // TODO: Add firebase write
            promise.resolve("");

            if (newUser.userId == null) {
                throw NullUserException();
            }
        } catch (e: Exception) {
            promise.reject(e);
        }
    }

    @ReactMethod
    // last parameter has to be a Promise, so that JavaScript side will return expect a Promise
    fun authenticateUser(promise: Promise) {
        try {
            val user = auth.currentUser
            //this.ActiveUser = dbConnection.getUserData(user!!.uid);
            promise.resolve(true)
        } catch (e: Exception) {
            promise.resolve(e)
        }
    }
}

class NullUserException : Exception("Null or Missing User");