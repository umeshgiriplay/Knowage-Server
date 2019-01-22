var app = angular.module('importExportDocumentModule',
		['ngMaterial', 'sbiModule', 'angular_table', 'document_tree', 'componentTreeModule', 'file_upload', 'bread_crumb']);


app.config(['$mdThemingProvider', function($mdThemingProvider) {

    $mdThemingProvider.theme('knowage')

$mdThemingProvider.setDefaultTheme('knowage');
}]);

app.factory("importExportDocumentModule_importConf", function() {
	 var current_data = {};
	 var default_values = {
		fileImport : {},
		associations : 'noAssociations',
		fileAssociation : '',
		roles : {
			currentRoles : [],
			exportedRoles : [],
			associatedRoles : {}
		},
		engines : {
			currentEngines : [],
			exportedEngines : [],
			associatedEngines : {}
		},
		datasources : {
			currentDatasources : [],
			exportedDatasources : [],
			associatedDatasources : {}
		},
		associationsFileName:"",
		logFileName:"",
		folderName:"",
		resetData: function() {
		    	 current_data = angular.copy( default_values,current_data);
		     }
	};
	 default_values.resetData();
	  return current_data;
});


app.controller('importExportController', ["$scope","sbiModule_translate","$mdToast",impExpFuncController]);
app.controller('exportController', ['$http','sbiModule_download','sbiModule_device',"$scope", "$mdDialog", "$timeout", "sbiModule_logger", "sbiModule_translate","sbiModule_restServices","sbiModule_config","$mdToast","sbiModule_messaging", "$filter", exportFuncController]);
app.controller('importController', ['sbiModule_download','sbiModule_device',"$scope", "$mdDialog", "$timeout", "sbiModule_logger", "sbiModule_translate","sbiModule_restServices","sbiModule_config","$mdToast","importExportDocumentModule_importConf","sbiModule_messaging",importFuncController]);

function impExpFuncController($scope,   sbiModule_translate ,$mdToast) {
	sbiModule_translate.addMessageFile("component_impexp_messages");
	$scope.translate = sbiModule_translate;

//	$scope.showToast=function(text, time) {
//		var timer = time == undefined ? 6000 : time;
//		console.log(text)
//		$mdToast.show($mdToast.simple().content(text).position('top').action(
//		'OK').highlightAction(false).hideDelay(timer));
//	}
}




function importFuncController(sbiModule_download,sbiModule_device,$scope, $mdDialog, $timeout, sbiModule_logger, sbiModule_translate, sbiModule_restServices,sbiModule_config,$mdToast,importExportDocumentModule_importConf) {
	$scope.stepItem=[{name: $scope.translate.load('sbi.ds.file.upload.button')}];
	$scope.selectedStep=0;
	$scope.download = sbiModule_download;
	$scope.stepControl;
	$scope.IEDConf=importExportDocumentModule_importConf;

//	$scope.fileImport= {};
//	$scope.associationsFileImport={};
//	$scope.associations="noAssociations";



	$scope.finishImport=function(){
		if(importExportDocumentModule_importConf.hasOwnProperty("resetData")){
			importExportDocumentModule_importConf.resetData();
		}
	}


	$scope.stopImport=function(text){
		 var alert = $mdDialog.alert()
				.title('')
				.content(text)
				.ariaLabel('error import')
				.ok('OK');
		$mdDialog.show(alert).then(function() {
			$scope.stepControl.resetBreadCrumb();
			$scope.stepControl.insertBread({name: sbiModule_translate.load('SBISet.impexp.exportedRoles','component_impexp_messages')});
			$scope.finishImport();
		} );
	}

	$scope.stopImportWithDownloadAss=function(text, folderAss, fileAss){
		var folder = folderAss;
		var file = fileAss;

		var confirm = $mdDialog.confirm()
		.title('')
		.content(text)
		.ariaLabel('error import')
		.ok(sbiModule_translate.load("sbi.general.yes"))
		.cancel(sbiModule_translate.load("sbi.general.No"));

		$mdDialog.show(confirm).then(function() {
			// choose to download association xml
			var data={"FILE_NAME":file, "FOLDER_NAME":folder};
			var config={"responseType": "arraybuffer"};

			sbiModule_restServices.promisePost("1.0/serverManager/importExport/document","downloadAssociationsFile",data,config)
			.then(function(response) {
				if (response.data.hasOwnProperty("errors")) {
				sbiModule_restServices.errorHandler(response.data.errors[0].message,"sbi.generic.toastr.title.error");

				$scope.stepControl.resetBreadCrumb();
				$scope.stepControl.insertBread({name: sbiModule_translate.load('SBISet.impexp.exportedRoles','component_impexp_messages')});
				$scope.finishImport();
			}else {
				// download association file
				$scope.download.getBlob(response.data,file,'text/xml','xml');

				$scope.stepControl.resetBreadCrumb();
				$scope.stepControl.insertBread({name: sbiModule_translate.load('SBISet.impexp.exportedRoles','component_impexp_messages')});
				$scope.finishImport();

			}
	}, function(response) {
		sbiModule_restServices.errorHandler(response.data.errors[0].message,"sbi.generic.toastr.title.error");
	});




},
	function() {
	$scope.stepControl.resetBreadCrumb();
		$scope.stepControl.insertBread({name: sbiModule_translate.load('SBISet.impexp.exportedRoles','component_impexp_messages')});
		$scope.finishImport();
});



//		var alert = $mdDialog.alert()
//				.title('')
//				.content(text)
//				.ariaLabel('error import')
//				.ok('OK');
//		$mdDialog.show(alert).then(function() {
//			$scope.stepControl.resetBreadCrumb();
//			$scope.stepControl.insertBread({name: sbiModule_translate.load('SBISet.impexp.exportedRoles','component_impexp_messages')});
//			$scope.finishImport();
//		} );
	}


}

function exportFuncController($http,sbiModule_download,sbiModule_device,$scope, $mdDialog, $timeout, sbiModule_logger,
		sbiModule_translate, sbiModule_restServices,sbiModule_config,$mdToast,sbiModule_messaging, $filter) {

	$scope.restServices = sbiModule_restServices;
	$scope.download = sbiModule_download;
	$scope.log = sbiModule_logger;
	$scope.selected =[] ;
	$scope.folders =[];
	$scope.filterDate;
	$scope.fileAssociation = {};
	$scope.flags = {
			waitExport : false,
			viewDownload : false
	}
	var selectedFiles = [];
	
	$scope.checkboxs={
			exportSubObj : false,
			exportSnapshots : false,
			exportCrossNav : false,
			exportBirt : false,
			exportScheduler : false,
			exportSelFunc: false
	};
	
	$scope.filterDocuments = function(){
		if($scope.filterDate!=undefined){
			$scope.restServices.get("2.0", "folders","dateFilter="+$scope.filterDate)
			.success(function(data){
				//if not errors in response, copy the data
				if (data.errors === undefined){
					$scope.folders=angular.copy(data);
				}else{
					$scope.folders=[];
				}
			})
			.error(function(data, status){
				$scope.folders=angular.copy(foldersJson);
				$scope.log.error('GET RESULT error of ' + data + ' with status :' + status);
			});

		}else{
			$scope.removeFilter();

		}
	}

	$scope.removeFilter = function(){
		$scope.filterDate = undefined;
		$scope.selected=[];
		$scope.restServices.get("2.0", "folders","includeDocs=true")
		.success(function(data){
			//if not errors in response, copy the data
			if (data.errors === undefined){
				$scope.folders=angular.copy(data);
			}else{
				$scope.folders=[];
			}
		})
		.error(function(data, status){
			$scope.folders=angular.copy(foldersJson);
			$scope.log.error('GET RESULT error of ' + data + ' with status :' + status);
		});
	}
	
	$scope.restServices.get("2.0", "folders","includeDocs=true")
	.success(function(data){
		//if not errors in response, copy the data
		if (data.errors === undefined){
//			$scope.folders=angular.copy(data);
			for (d in data){
				
				if (data[d].codType != "USER_FUNCT"){
					//doesn't add personal folders to the tree
					$scope.folders.push(data[d]);
				}
			}
			
			//tempFolders = angular.copy($scope.folders);
		}else{
			$scope.folders=[];
		}
	})
	.error(function(data, status){
		$scope.folders=angular.copy(foldersJson);
		$scope.log.error('GET RESULT error of ' + data + ' with status :' + status);
	});
	
	$scope.filterByStatus = {
			development: "",
			test: "",
			released: ""
	};
	
	function filteringDocuments(object) {
		
		var value = "";
		for(var key in object) 
			value += object[key];
		return value;
	}
	
	$scope.filterDoc = function() {
		$scope.test = filteringDocuments($scope.filterByStatus);
	}
	
	
	var goingThroughTree = function(folders) {
		var checkedDocs = [];
		var objArray = [];
		
		for(var i=0; i<folders.length; i++) {
			checkedDocs = $filter('filter')(folders[i].biObjects, {checked: true}, true);
			objArray = setObjectPath(folders[i].path, checkedDocs);
			if(folders[i].subfolders.length > 0)
				goingThroughTree(folders[i].subfolders);
		}
	}
	
	var setObjectPath = function(paths, checkedDocs) {
		
		var singlePath = [paths];
		
		for(var i=0; i<checkedDocs.length; i++) {
			checkedDocs[i].functionalities = singlePath;
			var obj = {"id": checkedDocs[i].id, "folder": paths}
			selectedFiles.push(obj);
		}
	}

	$scope.exportFiles= function(){
		
		var config={
				"DOCUMENT_ID_LIST":[],
				"EXPORT_FILE_NAME":$scope.exportName,
				"EXPORT_SUB_OBJ":$scope.checkboxs.exportSubObj,
				"EXPORT_SNAPSHOT":$scope.checkboxs.exportSnapshots,
				"EXPORT_CROSSNAV":$scope.checkboxs.exportCrossNav,
				"EXPORT_BIRT": $scope.checkboxs.exportBirt,
				"EXPORT_SCHEDULER": $scope.checkboxs.exportScheduler,
				"EXPORT_SELECTED_FUNCTIONALITY": $scope.checkboxs.exportSelFunc
		};
		
		goingThroughTree($scope.folders);
		
		if(!$scope.checkboxs.exportSelFunc){
			for (var i =0 ; i < $scope.selected.length;i++){
				if ($scope.selected[i].type == "biObject")
					config.DOCUMENT_ID_LIST.push(""+$scope.selected[i].id);
			}
		}
		
		if($scope.checkboxs.exportSelFunc) {
			config.DOCUMENT_ID_LIST = [];
			for(var i=0; i<selectedFiles.length; i++) {
				//if($scope.selected[i].type == "biObject") {
					config.DOCUMENT_ID_LIST.push(selectedFiles[i]);
				//}
			}
			
		}

		$scope.flags.waitExport=true;
//		sbiModule_restServices.post("1.0/serverManager/importExport/document","export",config)
//		.success(function(data, status, headers, config) {
//			if (data.hasOwnProperty("errors")) {
//				$scope.showToast(data.errors[0].message,4000);
//			}else if(data.hasOwnProperty("STATUS") && data.STATUS=="OK"){
//				$scope.flags.viewDownload = true;
//				$scope.downloadedFileName=$scope.exportName;
//			}
//			$scope.flags.waitExport=false;
//		}).error(function(data, status, headers, config) {
//			$scope.flags.waitExport=false;
//			$scope.showToast("ERRORS "+status,4000);
//		})

		sbiModule_restServices.promisePost("1.0/serverManager/importExport/document","export",config)
		.then(function(response) {
			if (response.data.hasOwnProperty("errors")) {
				sbiModule_restServices.errorHandler(response.data.errors[0].message,"sbi.generic.toastr.title.error");
			}else if(response.data.hasOwnProperty("STATUS") && response.data.STATUS=="OK"){
				$scope.flags.viewDownload = true;
				$scope.downloadedFileName=$scope.exportName;
			}
			$scope.flags.waitExport=false;
		}, function(response) {
			$scope.flags.waitExport=false;
			sbiModule_restServices.errorHandler(response.data.errors[0].message,"sbi.generic.toastr.title.error");
		});


	}
	

	$scope.submitDownForm = function(form){
		$scope.flags.submitForm= true;
	}

	$scope.toggleViewDownload = function(){
		$scope.flags.viewDownload = !$scope.flags.viewDownload;
	}
	$scope.downloadFile= function(){
		var data={"FILE_NAME":$scope.downloadedFileName};
		var config={"responseType": "arraybuffer"};
//		sbiModule_restServices.post("1.0/serverManager/importExport/document","downloadExportFile",data,config)
//		.success(function(data, status, headers, config) {
//			if (data.hasOwnProperty("errors")) {
//				$scope.showToast(data.errors[0].message,4000);
//			}else if(status==200){
//				$scope.download.getBlob(data,$scope.exportName,'application/zip','zip');
//				$scope.flags.viewDownload = false
//			}
//		}).error(function(data, status, headers, config) {
//			$scope.showToast("ERRORS "+status,4000);
//		})


		sbiModule_restServices.promisePost("1.0/serverManager/importExport/document","downloadExportFile",data,config)
		.then(function(response) {
			if (response.data.hasOwnProperty("errors")) {
				sbiModule_restServices.errorHandler(response.data.errors[0].message,"sbi.generic.toastr.title.error");
			}else {
				$scope.download.getBlob(response.data,$scope.exportName,'application/zip','zip');
				$scope.flags.viewDownload = false;
			}
		}, function(response) {
			sbiModule_restServices.errorHandler(response.data.errors[0].message,"sbi.generic.toastr.title.error");
		});

	}

	$scope.showAlert = function (title, message){
		$mdDialog.show(
				$mdDialog.alert()
				.parent(document.body)
				.clickOutsideToClose(true)
				.title(title)
				.textContent(message) //FROM angular material 1.0
				.ok('Ok')
		);
	}
	$scope.debug= function(){
		//$scope.isEnabled = !$scope.isEnabled;
	}
	
}