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
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.async
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.tasks.await

class FirebaseModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    // needed for native modules
    override fun getName() = "FirebaseModule"

    private var ActiveUser: UserSchema? = null
    private var dbConnection: DBService = DBService()
    private var auth: FirebaseAuth = FirebaseAuth.getInstance()
    private lateinit var authState: FirebaseAuth.AuthStateListener

    private var firebaseDB: FirebaseFirestore = FirebaseFirestore.getInstance()
    private val dbServiceScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    private val debug: Boolean = true

    data class UserSchema (
        val userId: String?,
        val displayName: String,
        val email: String,
        val profilePictureUrl: String?,
        val interests: Array<String>?,
    )

    init {
        // debug configs
        if (debug){
            auth.useEmulator("10.0.2.2", 8080)
            firebaseDB.useEmulator("10.0.2.2", 8080)
        }
        firebaseDB = FirebaseFirestore.getInstance("default")
    }

    // IMPORTANT: cannot use suspend methods for TurboReactNative modules
    // Also, last parameter has to be a Promise, so that JavaScript side will return expect a Promise
    @ReactMethod
    fun createNewUser(email: String, password: String, promise: Promise) {
        dbServiceScope.launch {
            try {
                val authState = auth.createUserWithEmailAndPassword(email, password)
                if (authState.await().user == null) {
                    promise.resolve(false)
                }
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject(e.toString())
            }
        }
    }

    @ReactMethod
    fun createUserData(displayName: String, email: String, promise: Promise) {
        dbServiceScope.launch {
            try {
                val newUser = UserSchema (
                    auth.currentUser?.uid,
                    displayName,
                    email,
                    "",
                    arrayOf()
                )
                if (newUser.userId == null) {
                    throw NullUserException()
                }
                val deferred = CoroutineScope(Dispatchers.Default).async {
                    return@async writeUserData(newUser)
                }
                // expect 'true' if succeeded, add 'false' case
                promise.resolve(deferred.await())
            } catch (e: Exception) {
                promise.reject(e.toString())
            }
        }
    }

    @ReactMethod
    fun authenticateUser(promise: Promise) {
        try {
            val user = auth.currentUser
            getUserData(user!!.uid)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.resolve(e.toString())
        }
    }

    @ReactMethod
    fun getActiveUser(promise: Promise) {

    }

    // users shouldn't be able to write data while data is already being written, hence runBlocking
    fun writeUserData(userData: UserSchema): Boolean {
        val result = runBlocking {
            try {
                val userDoc = firebaseDB.collection("users").document(userData.userId.toString())

                if (userDoc.get().await().get("userId") != null) {
                    userDoc.set(userData, SetOptions.mergeFields()).await()
                    return@runBlocking true
                } else {
                    return@runBlocking false
                }
            } catch (e: Exception) {
                throw(e)
            }
        }
        return result
    }

    fun getUserData(userID: String): DocumentSnapshot {
        val result = runBlocking {
            val user = firebaseDB.collection("users").document(userID)
            try {
                return@runBlocking user.get().await()
            } catch (e: Exception) {
                throw (e)
            }
        }
        return result
    }
}

class NullUserException : Exception("Null or Missing User");