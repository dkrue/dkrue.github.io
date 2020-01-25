---
layout: post
title:  "Automated stored procedures on Microsoft Azure"
date:   2015-10-14 19:01:26 -0500
categories: azure database
---
I needed to run a stored procedure in a Azure database every day at midnight.

To do this, set up an Azure automation account. Then create a new runbook with the following powershell script.  Finally, you will need to create a credential asset to plug into this script as an input parameter.

Once it's set up you can schedule it as a nightly job.

{% highlight powershell %}
workflow DailyExpirationCheck 
{
    param
    (
        # Fully-qualified name of the Azure DB server 
        [parameter(Mandatory=$true)] 
        [string] $SqlServerName,
        
        # Database name on the Azure DB server 
        [parameter(Mandatory=$true)] 
        [string] $DatabaseName,
		
	# Credentials for $SqlServerName stored as an Azure Automation credential asset
	# When using in the Azure Automation UI, please enter the name of the credential asset for the "Credential" parameter
        [parameter(Mandatory=$true)] 
        [PSCredential] $Credential
    )
    
    inlinescript{
        
        # Set up credentials   
        $ServerName = $Using:SqlServerName
        $DatabaseName = $Using:DatabaseName
        $UserId = $Using:Credential.UserName
        $Password = ($Using:Credential).GetNetworkCredential().Password
        
        # Create connection to DB
        $DatabaseConnection = New-Object System.Data.SqlClient.SqlConnection
        $DatabaseConnection.ConnectionString = "Server = $ServerName; Database = $DatabaseName; User ID = $UserId; Password = $Password;"
        $DatabaseConnection.Open();
        
        # Create command to execute stored procedures
        $DatabaseCommand = New-Object System.Data.SqlClient.SqlCommand
        $DatabaseCommand.Connection = $DatabaseConnection
        $DatabaseCommand.CommandType = [System.Data.CommandType]::StoredProcedure
        
        # Update statuses by calling our stored procedure
        $DatabaseCommand.CommandText = "Update_After_EndDate_Passed"
        $DatabaseCommand.ExecuteNonQuery() | out-null
        if($? -eq 1)
        {
            Write-Output "EndDate check successfully completed."   
        }
     
        # Close connection to DB
        $DatabaseConnection.Close() 
        
        Write-Output "[Daily expiration checks complete.]"
    }    
}
{% endhighlight %}