package com.knect.services

import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import com.knect.FirebaseModule
import kotlinx.coroutines.tasks.await

class DBService {
    private var firebaseDB: FirebaseFirestore = FirebaseFirestore.getInstance();

    init {
        dbConnect("default", false)
    }

    fun dbConnect(databaseID: String, debug: Boolean) {
        try
        {
            firebaseDB = FirebaseFirestore.getInstance(databaseID)
            if (debug){
                firebaseDB.useEmulator("10.0.2.2", 8080)
            }
        }
        catch (e: Exception)
        {
            e.printStackTrace()
        }
    }

    suspend fun getUserData(userID: String): DocumentSnapshot {
        val user = firebaseDB.collection("users").document(userID); //collection("users");
        // val query = users.whereEqualTo("userId", UserID);
        try
        {
            print(user);
            return user.get().await();
        }
        catch (e: Exception)
        {
            throw(e);
        }
    }

    suspend fun writeUserData(userData: FirebaseModule.UserSchema) {
        val userDoc = firebaseDB.collection("users").document(userData.userId.toString());
        if (userDoc.get().await().get("userId") != null) {
            userDoc.set(userData, SetOptions.mergeFields()).await();
        }
    }
}